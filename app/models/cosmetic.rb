class Cosmetic < ApplicationRecord
  KINDS = %w[hat sunglasses frame].freeze
  CATEGORIES = %w[clothing frame].freeze

  has_many :user_cosmetics, dependent: :destroy
  has_many :users, through: :user_cosmetics

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validates :asset_key, presence: true

  scope :active, -> { where(active: true) }
  scope :default_grant, -> { where(default_grant: true) }
  scope :beta_only, -> { where(beta_only: true) }
  scope :clothing, -> { where(category: "clothing") }
  scope :frames, -> { where(category: "frame") }

  after_create :grant_to_beta_testers

  private

  def grant_to_beta_testers
    return unless active? && beta_only?

    User.beta_testers.find_each do |user|
      user.user_cosmetics.find_or_create_by!(cosmetic: self) { |uc| uc.source = "grant" }
    end
  end
end
