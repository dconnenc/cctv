class PerformerPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.present?
  end

  def update?
    user.present? && (user.admin? || user.superadmin? || record.user_id == user.id)
  end

  def destroy?
    user.present? && (user.admin? || user.superadmin? || record.user_id == user.id)
  end
end
