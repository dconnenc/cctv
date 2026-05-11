class Event < ApplicationRecord
  belongs_to :creator, class_name: "User"
  belongs_to :experience, optional: true
  has_many :event_performers, -> { order(position: :asc) }, dependent: :destroy
  has_many :performers, through: :event_performers

  validates :title, presence: true, length: { maximum: 255 }
  validates :starts_at, presence: true
  validates :ends_at, presence: true
  validates :slug, presence: true, uniqueness: true
  validate :ends_at_after_starts_at, if: -> { starts_at.present? && ends_at.present? }

  before_validation :generate_slug, on: :create

  scope :published, -> { where(published: true) }
  scope :upcoming, -> { where("starts_at >= ?", Time.current) }
  scope :in_month, ->(month, year) {
    start_date = Date.new(year, month, 1).beginning_of_day
    end_date = start_date.end_of_month.end_of_day
    where(starts_at: start_date..end_date)
  }

  def active?
    return false unless experience_id.present?
    return false unless Time.current.between?(starts_at, ends_at)

    experience&.status.in?(%w[lobby live])
  end

  private

  def ends_at_after_starts_at
    if ends_at <= starts_at
      errors.add(:ends_at, "must be after start time")
    end
  end

  def generate_slug
    return if slug.present? || title.blank?

    base_slug = title.downcase
                     .gsub(/[^a-z0-9\-\s]/, '')
                     .gsub(/[\s]+/, '-')
                     .gsub(/-+/, '-')
                     .gsub(/^-|-$/, '')

    candidate = base_slug
    counter = 1

    while Event.exists?(slug: candidate)
      candidate = "#{base_slug}-#{counter}"
      counter += 1
    end

    self.slug = candidate
  end
end
