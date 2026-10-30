module Minigames
  module Fishy
    # Redis-backed live state for one Fishy game. Phones write inputs and dash
    # requests from the channel; the tick job is the only writer of `state`.
    # Nothing here touches Postgres — the payload only learns the outcome when
    # the game is finalized.
    #
    # Keys are namespaced by generation (the game's `started_at`), so a restart
    # can never be overwritten by a tick loop still finishing the previous game.
    class Store
      TTL = 2.hours.to_i
      LEASE_SECONDS = 3

      attr_reader :block_id, :generation

      def self.for(block)
        new(block.id, block.payload&.dig("started_at"))
      end

      def initialize(block_id, generation)
        @block_id   = block_id
        @generation = generation
      end

      def read_state
        raw = redis { |r| r.get(key(:state)) }
        raw && JSON.parse(raw)
      end

      def write_state(state)
        redis { |r| r.set(key(:state), state.to_json, ex: TTL) }
      end

      def set_input(slot, dx, dy)
        redis do |r|
          r.hset(key(:inputs), slot.to_s, "#{dx},#{dy}")
          r.expire(key(:inputs), TTL)
        end
      end

      def clear_input(slot)
        redis { |r| r.hdel(key(:inputs), slot.to_s) }
      end

      # @return [Hash{Integer => Array(Float, Float)}]
      def read_inputs
        parse_vectors(redis { |r| r.hgetall(key(:inputs)) })
      end

      def queue_dash(slot, dx, dy)
        redis do |r|
          r.hset(key(:dashes), slot.to_s, "#{dx},#{dy}")
          r.expire(key(:dashes), TTL)
        end
      end

      # Reads and clears pending dashes atomically so none are applied twice.
      def take_dashes
        raw, _deleted = redis do |r|
          r.multi do |m|
            m.hgetall(key(:dashes))
            m.del(key(:dashes))
          end
        end
        parse_vectors(raw)
      end

      def acquire_lease(token)
        redis { |r| r.set(key(:lease), token, nx: true, ex: LEASE_SECONDS) }.present?
      end

      def renew_lease(token)
        redis do |r|
          next false unless r.get(key(:lease)) == token

          r.expire(key(:lease), LEASE_SECONDS)
          true
        end
      end

      def release_lease(token)
        redis { |r| r.del(key(:lease)) if r.get(key(:lease)) == token }
      end

      def running?
        redis { |r| r.exists(key(:lease)) }.positive?
      end

      def stop!
        redis { |r| r.set(key(:stopped), "1", ex: TTL) }
      end

      def stopped?
        redis { |r| r.exists(key(:stopped)) }.positive?
      end

      def clear!
        redis { |r| r.del(*%i[state inputs dashes lease stopped].map { |name| key(name) }) }
      end

      private

      def key(name)
        "fishy:#{block_id}:#{generation}:#{name}"
      end

      def redis(&)
        Sidekiq.redis(&)
      end

      def parse_vectors(raw)
        (raw || {}).each_with_object({}) do |(slot, value), result|
          dx, dy = value.split(",").map(&:to_f)
          result[slot.to_i] = [dx, dy]
        end
      end
    end
  end
end
