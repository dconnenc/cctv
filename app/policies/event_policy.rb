class EventPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def ical?
    true
  end

  def create?
    user&.admin? || user&.superadmin?
  end

  def update?
    user&.admin? || user&.superadmin?
  end

  def destroy?
    user&.admin? || user&.superadmin?
  end
end
