class Experience < ApplicationRecord
  has_many :experience_participants, dependent: :destroy
  has_many :users, through: :experience_participants

  has_many :host_participants, -> { where(role: 'host') },
           class_name: 'ExperienceParticipant'
  has_many :hosts, through: :host_participants, source: :user

  has_many_attached :attachments
  has_many :events

  has_many :experience_segments,
    -> { order(position: :asc) },
    dependent: :destroy

  belongs_to :default_segment,
    class_name: "ExperienceSegment",
    optional: true

  DEFAULT_SEGMENT_NAME  = "Audience".freeze
  DEFAULT_SEGMENT_COLOR = "#6B7280".freeze
  AUTO_ASSIGNED_ROLES   = %w[audience player].freeze

  has_many :experience_blocks,
    -> { order(position: :asc) },
    dependent: :destroy

  has_many :parent_blocks,
    -> { where(parent_block_id: nil).order(position: :asc) },
    class_name: "ExperienceBlock",
    foreign_key: :experience_id

  belongs_to :creator, class_name: 'User'

  enum :status, {
    draft: DRAFT = "draft",
    lobby: LOBBY = "lobby",
    live: LIVE = "live",
    paused: PAUSED = "paused",
    finished: FINISHED = "finished",
    archived: ARCHIVED = "archived"
  }

  validates :code, presence: true, uniqueness: true, length: { minimum: 1, maximum: 255 }
  validates :code_slug, presence: true, uniqueness: true
  validate :validate_playbill_structure

  before_validation :generate_code_slug, if: :code_changed?

  def self.validate_code(code)
    return [false, "Nil code"] if code.nil?

    if Experience.exists?(code: code)
      [false, "Experience already exists with code: #{code}"]
    else
      [true, "Valid code"]
    end
  end

  def self.find_by_code_or_slug(code_or_slug)
    find_by_code(code_or_slug) || find_by_slug(code_or_slug)
  end

  # Find by user-entered code (case-insensitive via citext)
  def self.find_by_code(code)
    find_by(code: code)
  end

  # Find by URL slug
  def self.find_by_slug(slug)
    find_by(code_slug: slug)
  end

  # Generate a random experience code
  def self.generate_code
    SecureRandom.alphanumeric(8).upcase
  end

  # Check if a user has joined this experience
  def has_user?(user)
    users.include?(user)
  end

  def user_registered?(user)
    has_user?(user)
  end

  def register_user(user, name:)
    return if user_registered?(user)

    participant = experience_participants.create!(
      user: user,
      name: name,
      avatar: user.most_recent_avatar.presence || {}
    )

    attach_default_segment(participant)
    participant
  end

  # Idempotently returns this experience's default segment, recreating it if
  # the host previously deleted it (so registrations always have a target).
  def ensure_default_segment!(name: nil)
    if default_segment_id.present?
      existing = experience_segments.find_by(id: default_segment_id)
      return existing if existing
    end

    segment = experience_segments.find_or_create_by!(
      name: name.presence || default_segment&.name || DEFAULT_SEGMENT_NAME
    ) do |s|
      s.color = DEFAULT_SEGMENT_COLOR
      s.position = experience_segments.count
    end

    update_column(:default_segment_id, segment.id) if default_segment_id != segment.id
    segment
  end

  def attach_default_segment(participant)
    return unless AUTO_ASSIGNED_ROLES.include?(participant.role.to_s)

    segment = ensure_default_segment!
    return if ExperienceParticipantSegment.exists?(
      experience_participant_id: participant.id,
      experience_segment_id: segment.id
    )

    ExperienceParticipantSegment.create!(
      experience_participant: participant,
      experience_segment: segment
    )
  end

  def jwt_for_participant(user)
    Experiences::AuthService.jwt_for_participant(experience: self, user: user)
  end

  private

  def validate_playbill_structure
    return if playbill.blank?

    unless playbill.is_a?(Array)
      errors.add(:playbill, "must be an array")
      return
    end

    playbill.each_with_index do |section, i|
      unless section.is_a?(Hash)
        errors.add(:playbill, "section #{i} must be a hash")
        next
      end

      unless section["title"].is_a?(String) && section["body"].is_a?(String)
        errors.add(:playbill, "section #{i} must have title and body strings")
      end

      if section.key?("image_signed_id") && !section["image_signed_id"].is_a?(String)
        errors.add(:playbill, "section #{i} image_signed_id must be a string")
      end
    end
  end

  # Generate a URL-safe slug from the code
  # Preserves the original code but creates a slug for use in URLs
  def generate_code_slug
    return if code.blank?

    # Convert to lowercase and replace non-alphanumeric characters with hyphens
    slug = code.downcase
               .gsub(/[^a-z0-9\-]/, '-')  # Replace non-alphanumeric with hyphens
               .gsub(/-+/, '-')            # Collapse multiple hyphens
               .gsub(/^-|-$/, '')          # Remove leading/trailing hyphens

    self.code_slug = slug
  end

end
