class UserCosmetic < ApplicationRecord
  belongs_to :user
  belongs_to :cosmetic

  validates :cosmetic_id, uniqueness: { scope: :user_id }

  before_validation :set_acquired_at, on: :create

  private

  def set_acquired_at
    self.acquired_at ||= Time.current
  end
end
