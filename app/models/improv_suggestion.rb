class ImprovSuggestion < ApplicationRecord
  MAX_LENGTH = 100

  belongs_to :experience_block
  belongs_to :user
  has_many :improv_votes, dependent: :destroy

  validates :text, presence: true, length: { maximum: MAX_LENGTH }

  scope :active, -> { where(cleared_at: nil) }
  scope :cleared, -> { where.not(cleared_at: nil) }

  def cleared?
    cleared_at.present?
  end

  def clear!
    update!(cleared_at: Time.current)
  end
end
