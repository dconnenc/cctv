class ExperiencePolicy < ApplicationPolicy
  def create?
    user&.admin? || user&.superadmin?
  end

  def show?
    true
  end

  def register?
    true
  end

  def open_lobby?
    admin? || host_participant?
  end

  def start?
    admin? || host_participant?
  end

  def pause?
    admin? || host_participant?
  end

  def resume?
    admin? || host_participant?
  end

  def manage_blocks?
    admin? || host_participant?
  end

  def submit_poll_response?
    # Anyone who is a participant can submit a poll
    # This is a weak auth for now as it doesn't account for roles and visibility
    record.has_user?(user)
  end

  private

  def admin?
    user&.admin? || user&.superadmin?
  end

  def host_participant?
    return false unless user

    record.experience_participants.host.exists?(user: user)
  end
end
