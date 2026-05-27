class ExperienceParticipantPolicy < ApplicationPolicy
  def update_avatar?
    own_record? || manage?
  end

  private

  def own_record?
    user&.id == record.user_id
  end

  def manage?
    user&.admin? || user&.superadmin? ||
      record.experience.experience_participants.host.exists?(user: user) ||
      record.experience.experience_participants.moderator.exists?(user: user)
  end
end
