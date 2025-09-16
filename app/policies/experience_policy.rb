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

  private

  def admin?
    user&.admin? || user&.superadmin?
  end

  def host_participant?
    return false unless user

    record.experience_participants.host.exists?(user: user)
  end
end
