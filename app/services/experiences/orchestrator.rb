module Experiences
  class Orchestrator < BaseService
    def add_block!(
      kind:,
      payload: {},
      visible_to_roles: [],
      visible_to_segments: [],
      target_user_ids: [],
      status: :hidden,
      open_immediately: false
    )
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        transaction do
          block = experience.experience_blocks.create!(
            kind: kind,
            status: status,
            payload: payload,
            visible_to_roles: visible_to_roles,
            visible_to_segments: visible_to_segments,
            target_user_ids: target_user_ids
          )
          block.update!(status: :open) if open_immediately

          block
        end
      end
    end

    def close_block!(block_id)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        block = experience.experience_blocks.find(block_id)

        block.update(status: :closed)
      end
    end

    def open_block!(block_id)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        block = experience.experience_blocks.find(block_id)

        block.update(status: :open)
      end
    end

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

    def submit_poll_response!(block_id:, answer:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        
        # Use dedicated ExperienceBlockPolicy to check visibility rules
        authorize! block, to: :submit_poll_response?, with: ExperienceBlockPolicy

        # Create or update the submission. Assumes single response for now
        submission = ExperiencePollSubmission.find_or_initialize_by(
          experience_block_id: block.id,
          user_id: actor.id
        )

        submission.answer = answer
        submission.save!

        submission
      end
    end

    def submit_question_response!(block_id:, answer:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        
        # Use dedicated ExperienceBlockPolicy to check visibility rules
        authorize! block, to: :submit_question_response?, with: ExperienceBlockPolicy

        # Create or update the submission. Assumes single response for now
        submission = ExperienceQuestionSubmission.find_or_initialize_by(
          experience_block_id: block.id,
          user_id: actor.id
        )

        submission.answer = answer
        submission.save!

        submission
      end
    end

    def submit_multistep_form_response!(block_id:, answer:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        
        # Use dedicated ExperienceBlockPolicy to check visibility rules
        authorize! block, to: :submit_multistep_form_response?, with: ExperienceBlockPolicy

        # Create or update the submission. Assumes single response for now
        submission = ExperienceMultistepFormSubmission.find_or_initialize_by(
          experience_block_id: block.id,
          user_id: actor.id
        )

        submission.answer = answer
        submission.save!

        submission
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
