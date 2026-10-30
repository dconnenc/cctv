module Minigames
  module Fishy
    # One game's tick loop body: read inputs, step the simulation, persist, and
    # broadcast only when something changed (plus a periodic keyframe). The
    # FishyTickJob owns timing; this class owns everything a tick does, so specs
    # can drive ticks directly.
    class Runner
      attr_reader :block, :store, :simulation

      def initialize(block:, store: Store.for(block), broadcaster: Experiences::Broadcaster.new(block.experience))
        @block       = block
        @store       = store
        @broadcaster = broadcaster
      end

      # @return [Boolean] false when there is no live state for this generation
      def load
        state = store.read_state
        return false unless state && state["started_at"] == store.generation

        @simulation = Simulation.new(state)
        true
      end

      def game_current?
        payload = block.reload.payload || {}
        payload["started_at"] == store.generation && payload["ended_at"].blank?
      end

      def broadcast_keyframe(eliminated: [])
        @last_keyframe_at = simulation.elapsed
        broadcast(simulation.keyframe(eliminated: eliminated))
      end

      # @return [Symbol] :continue, :finished, or :stopped
      def tick!(dt)
        return :stopped if store.stopped?
        return :continue if Time.current < play_starts_at

        result = simulation.step(dt, inputs: store.read_inputs, dashes: store.take_dashes)
        store.write_state(simulation.state)

        if keyframe_due?
          broadcast_keyframe(eliminated: result.eliminated)
        elsif result.changed
          broadcast(simulation.delta_frame(result))
        end

        if simulation.finished? || simulation.elapsed >= Config::MAX_DURATION_SECONDS
          Finalizer.call(block)
          return :finished
        end

        :continue
      end

      private

      def play_starts_at
        @play_starts_at ||= Time.zone.parse(store.generation)
      end

      def keyframe_due?
        simulation.elapsed - (@last_keyframe_at || 0.0) >= Config::KEYFRAME_SECONDS
      end

      def broadcast(frame)
        @broadcaster.broadcast_fishy_frame(block_id: block.id, started_at: store.generation, frame: frame)
      end
    end
  end
end
