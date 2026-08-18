class User < ApplicationRecord
  has_many :experience_participants, dependent: :destroy
  has_many :experiences, through: :experience_participants
  has_many :created_experiences, class_name: "Experience", foreign_key: :creator_id, dependent: :destroy
  has_many :created_events, class_name: "Event", foreign_key: :creator_id, dependent: :destroy
  has_one :performer, dependent: :destroy
  has_many :follows, dependent: :destroy
  has_many :followed_performers, through: :follows, source: :performer
  has_many :user_cosmetics, dependent: :destroy
  has_many :cosmetics, through: :user_cosmetics

  # Users created before this cutoff are beta testers and receive beta-only
  # cosmetics. The cutoff is in the past, so new signups are not beta testers.
  BETA_TESTER_CUTOFF = Time.utc(2026, 7, 1)

  enum :role, {
    user: "user",
    admin: "admin",
    superadmin: "superadmin"
  }

  scope :beta_testers, -> { where("created_at < ?", BETA_TESTER_CUTOFF) }

  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :email,
    presence: true,
    format: { with: URI::MailTo::EMAIL_REGEXP },
    uniqueness: { case_sensitive: false }

  passwordless_with :email

  before_save { self.email = email.downcase.strip }
  after_create :grant_starter_cosmetics

  def beta_tester?
    created_at.present? && created_at < BETA_TESTER_CUTOFF
  end

  # Everyone gets default-granted cosmetics; beta testers additionally get
  # beta-only cosmetics.
  def grant_starter_cosmetics
    scope = beta_tester? ? Cosmetic.active.where("default_grant OR beta_only") : Cosmetic.active.default_grant
    scope.find_each do |cosmetic|
      user_cosmetics.find_or_create_by!(cosmetic: cosmetic) { |uc| uc.source = "grant" }
    end
  end

  # Used by posthog-rails to associate automatically captured errors with this user.
  def posthog_distinct_id
    id.to_s
  end

  def most_recent_participant_name
    experience_participants.order(created_at: :desc).first&.name
  end

  def most_recent_avatar
    experience_participants.order(created_at: :desc).first&.avatar&.presence
  end

  def performer_slug
    performer&.slug
  end
end
