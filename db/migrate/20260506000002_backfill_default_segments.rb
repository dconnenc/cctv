class BackfillDefaultSegments < ActiveRecord::Migration[7.2]
  def up
    Experience.where(default_segment_id: nil).find_each do |experience|
      segment = experience.experience_segments.find_or_create_by!(name: Experience::DEFAULT_SEGMENT_NAME) do |s|
        s.color = Experience::DEFAULT_SEGMENT_COLOR
        s.position = (experience.experience_segments.maximum(:position) || -1) + 1
      end

      participant_ids = experience.experience_participants.where(role: Experience::AUTO_ASSIGNED_ROLES).pluck(:id)

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
