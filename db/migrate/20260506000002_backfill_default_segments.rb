class BackfillDefaultSegments < ActiveRecord::Migration[7.2]
  DEFAULT_NAME    = "Audience".freeze
  DEFAULT_COLOR   = "#6B7280".freeze
  ASSIGNED_ROLES  = %w[audience player].freeze

  def up
    Experience.where(default_segment_id: nil).find_each do |experience|
      segment = experience.experience_segments.find_or_create_by!(name: DEFAULT_NAME) do |s|
        s.color = DEFAULT_COLOR
        s.position = (experience.experience_segments.maximum(:position) || -1) + 1
      end

      participant_ids = experience.experience_participants.where(role: ASSIGNED_ROLES).pluck(:id)

      existing_participant_ids = ExperienceParticipantSegment
        .where(experience_segment_id: segment.id, experience_participant_id: participant_ids)
        .pluck(:experience_participant_id)

      missing = participant_ids - existing_participant_ids
      if missing.any?
        ExperienceParticipantSegment.insert_all(
          missing.map { |pid| { experience_participant_id: pid, experience_segment_id: segment.id } }
        )
      end

      experience.update_column(:default_segment_id, segment.id)
    end
  end

  def down
    # Data-only migration; no structural rollback. Removing the column
    # is handled by AddDefaultSegmentToExperiences#down.
  end
end
