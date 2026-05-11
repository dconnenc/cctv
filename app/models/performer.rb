class Performer < ApplicationRecord
  belongs_to :user
  has_many :event_performers, dependent: :destroy
  has_many :events, through: :event_performers
  has_many :follows, dependent: :destroy
  has_many :followers, through: :follows, source: :user

  has_one_attached :photo

  validates :name, presence: true, length: { maximum: 255 }
  validates :slug, presence: true, uniqueness: true
  validates :user_id, uniqueness: { message: "already has a performer profile" }

  before_validation :generate_slug, on: :create

  scope :ordered, -> { order(name: :asc) }

  def photo_url
    return nil unless photo.attached?

    Rails.application.routes.url_helpers.rails_blob_url(photo, only_path: true)
  end

  def follower_count
    follows.count
  end

  def followed_by?(user)
    return false unless user

    follows.exists?(user: user)
  end

  private

  def generate_slug
    return if slug.present? || name.blank?

    base_slug = name.downcase
                    .gsub(/[^a-z0-9\-\s]/, '')
                    .gsub(/[\s]+/, '-')
                    .gsub(/-+/, '-')
                    .gsub(/^-|-$/, '')

    candidate = base_slug
    counter = 1

    while Performer.exists?(slug: candidate)
      candidate = "#{base_slug}-#{counter}"
      counter += 1
    end

    self.slug = candidate
  end
end
