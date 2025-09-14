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
end
