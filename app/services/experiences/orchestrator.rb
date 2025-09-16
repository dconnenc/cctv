module Experiences
  class Orchestrator < BaseService
    def open_lobby!
      actor_action do
        authorize! experience, to: :open_lobby?, with: ExperiencePolicy

        transaction do
          experience.update!(
            status: Experience.statuses[:lobby],
            join_open: true
          )
        end
      end
    end

    def start!
      actor_action do
        authorize! experience, to: :start?, with: ExperiencePolicy

        transaction do
          experience.update!(
            status: Experience.statuses[:live],
            started_at: DateTime.now,
            join_open: true
          )
        end
      end
    end

    def pause!
      actor_action do
        authorize! experience, to: :pause?, with: ExperiencePolicy
        guard_state!([:live, :lobby])

        transaction do
          experience.update!(
            status: Experience.statuses[:paused]
          )
        end
      end
    end

    def resume!
      actor_action do
        authorize! experience, to: :resume?, with: ExperiencePolicy
        guard_state!(:paused)

        transaction do
          experience.update!(
            status: Experience.statuses[:live]
          )
        end
      end
    end

    private

    def guard_state!(allowed)
      return if Array(allowed).map(&:to_s).include?(experience.status)

      raise(
        Experiences::InvalidTransitionError,
        "Need #{Array(allowed).join('|')} but was #{experience.status}"
      )
    end
  end
end
