module Experiences
  class SegmentOrchestrator < BaseService
    def create_segment!(name:, color: '#6B7280')
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        max_position = experience.experience_segments.maximum(:position) || -1

        experience.experience_segments.create!(
          name: name,
          color: color,
          position: max_position + 1
        )
      end
    end

    def update_segment!(segment_id:, name: nil, color: nil)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        segment = experience.experience_segments.find(segment_id)

        attrs = {}
        attrs[:name] = name if name.present?
        attrs[:color] = color if color.present?

        segment.update!(attrs)

        segment
      end
    end

    def destroy_segment!(segment_id:)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        segment = experience.experience_segments.find(segment_id)
        segment.destroy!
      end
    end

    def assign_participants!(segment_id:, participant_ids:)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        segment = experience.experience_segments.find(segment_id)

        existing_ids = ExperienceParticipantSegment
          .where(experience_segment_id: segment.id, experience_participant_id: participant_ids)
          .pluck(:experience_participant_id)

        new_ids = participant_ids - existing_ids

        if new_ids.any?
          ExperienceParticipantSegment.insert_all(
            new_ids.map { |id| { experience_participant_id: id, experience_segment_id: segment.id } }
          )
        end
      end
    end

    def remove_participants!(segment_id:, participant_ids:)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        segment = experience.experience_segments.find(segment_id)

        ExperienceParticipantSegment
          .where(experience_segment_id: segment.id, experience_participant_id: participant_ids)
          .delete_all
      end
    end
  end
end
