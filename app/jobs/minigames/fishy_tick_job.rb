module Minigames
  # Runs one Fishy game's authoritative tick loop for its whole duration. A
  # Redis lease (renewed every tick) guarantees a single loop per game; if
  # Sidekiq restarts mid-game the requeued job waits out the stale lease and
  # resumes from the state persisted in Redis.
  class FishyTickJob < ApplicationJob
    queue_as :realtime

    discard_on ActiveRecord::RecordNotFound

    LEASE_WAIT_SECONDS    = Fishy::Store::LEASE_SECONDS + 2
    PAYLOAD_CHECK_SECONDS = 1.0

    def perform(block_id, expected_started_at)
      block = ExperienceBlock.find(block_id)
      return unless block.kind == ExperienceBlock::MINIGAME_FISHY

      payload = block.payload || {}
      return unless payload["started_at"] == expected_started_at && payload["ended_at"].blank?

      store = Fishy::Store.for(block)
      token = SecureRandom.hex(8)
      return unless acquire_lease(store, token)

      begin
        runner = Fishy::Runner.new(block: block, store: store)
        return unless runner.load

        runner.broadcast_keyframe
        run(runner, store, token)
      ensure
        store.release_lease(token)
      end
    end

    private

    def acquire_lease(store, token)
      deadline = monotonic_now + LEASE_WAIT_SECONDS
      loop do
        return true if store.acquire_lease(token)
        return false if monotonic_now >= deadline

        sleep(0.5)
      end
    end

    def run(runner, store, token)
      last_tick  = monotonic_now
      last_check = last_tick

      loop do
        tick_started = monotonic_now
        break unless store.renew_lease(token)

        if tick_started - last_check >= PAYLOAD_CHECK_SECONDS
          break unless runner.game_current?

          last_check = tick_started
        end

        break unless runner.tick!(tick_started - last_tick) == :continue

        last_tick = tick_started
        remaining = Fishy::Config::TICK_SECONDS - (monotonic_now - tick_started)
        sleep(remaining) if remaining.positive?
      end
    end

    def monotonic_now
      Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end
  end
end
