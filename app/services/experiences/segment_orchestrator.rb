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
        old_name = segment.name

        attrs = {}
        attrs[:name] = name if name.present?
        attrs[:color] = color if color.present?

        transaction do
          segment.update!(attrs)

          if name.present? && name != old_name
            cascade_rename(old_name, name)
          end
        end

        segment
      end
    end

    def destroy_segment!(segment_id:)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        segment = experience.experience_segments.find(segment_id)
        segment_name = segment.name

        transaction do
          cascade_remove(segment_name)
          segment.destroy!
        end
      end
    end

    def assign_participants!(segment_id:, participant_ids:)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        segment = experience.experience_segments.find(segment_id)
        participants = experience.experience_participants.where(id: participant_ids)

        transaction do
          participants.each do |participant|
            unless participant.segments.include?(segment.name)
              participant.update!(segments: participant.segments + [segment.name])
            end
          end
        end

        trigger_resubscription(participants)
      end
    end

    def remove_participants!(segment_id:, participant_ids:)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        segment = experience.experience_segments.find(segment_id)
        participants = experience.experience_participants.where(id: participant_ids)

        transaction do
          participants.each do |participant|
            if participant.segments.include?(segment.name)
              participant.update!(segments: participant.segments - [segment.name])
            end
          end
        end

        trigger_resubscription(participants)
      end
    end

    private

    def cascade_rename(old_name, new_name)
      experience.experience_participants
        .where("? = ANY(segments)", old_name)
        .update_all(
          Arel.sql(
            ActiveRecord::Base.sanitize_sql_array([
              "segments = array_replace(segments, ?, ?)",
              old_name, new_name
            ])
          )
        )

      experience.experience_blocks
        .where("? = ANY(visible_to_segments)", old_name)
        .update_all(
          Arel.sql(
            ActiveRecord::Base.sanitize_sql_array([
              "visible_to_segments = array_replace(visible_to_segments, ?, ?)",
              old_name, new_name
            ])
          )
        )
    end

    def cascade_remove(segment_name)
      experience.experience_participants
        .where("? = ANY(segments)", segment_name)
        .update_all(
          Arel.sql(
            ActiveRecord::Base.sanitize_sql_array([
              "segments = array_remove(segments, ?)",
              segment_name
            ])
          )
        )

      experience.experience_blocks
        .where("? = ANY(visible_to_segments)", segment_name)
        .update_all(
          Arel.sql(
            ActiveRecord::Base.sanitize_sql_array([
              "visible_to_segments = array_remove(visible_to_segments, ?)",
              segment_name
            ])
          )
        )
    end

    def trigger_resubscription(participants)
      participants.each do |participant|
        stream_key = Experiences::Broadcaster.stream_key_for_participant(participant)
        ActionCable.server.broadcast(stream_key, {
          type: "resubscribe_required",
          reason: "segment_changed",
          metadata: {
            participant_id: participant.id,
            timestamp: Time.current.to_f
          }
        })
      end
    end
  end
end
