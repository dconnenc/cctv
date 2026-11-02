module Minigames
  module Fishy
    # Ends a Fishy game exactly once: whichever caller (the tick loop on last
    # survivor / time cap, or the host's End button) acquires the row lock first
    # records the standings from the live Redis state.
    module Finalizer
      module_function

      # @return [Boolean] true when this call ended the game
      def call(block)
        store = nil

        ended = ActiveRecord::Base.transaction do
          block.lock!
          payload = block.payload || {}
          next false if payload["started_at"].blank? || payload["ended_at"].present?

          store     = Store.for(block)
          standings = standings_for(store.read_state, Array(payload["roster"]))

          payload["ended_at"]              = Time.current.iso8601
          payload["standings"]             = standings
          payload["winner_participant_id"] = standings.first&.dig("participant_id")
          block.update!(payload: payload)
          true
        end

        return false unless ended

        store.stop!
        Experiences::Broadcaster.enqueue_update(block.experience)
        true
      end

      def standings_for(state, roster)
        return [] unless state

        Simulation.new(state).standings.filter_map do |entry|
          participant_id = roster[entry["slot"]]
          next unless participant_id

          { "participant_id" => participant_id, "place" => entry["place"], "size" => entry["size"] }
        end
      end
    end
  end
end
