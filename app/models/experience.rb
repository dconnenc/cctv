class Experience < ApplicationRecord
  has_many :experience_participants, dependent: :destroy
  has_many :users, through: :experience_participants

  has_many :host_participants, -> { where(role: 'host') },
           class_name: 'ExperienceParticipant'
  has_many :hosts, through: :host_participants, source: :user

  has_many :experience_blocks, dependent: :destroy

  belongs_to :creator, class_name: 'User'

  enum status: {
    draft: DRAFT = "draft",
    lobby: LOBBY = "lobby",
    live: LIVE = "live",
    paused: PAUSED = "paused",
    finished: FINISHED = "finished",
    archived: ARCHIVED = "archived"
  }

  validates :code, presence: true, uniqueness: true, length: { minimum: 1, maximum: 255 }

  def self.validate_code(code)
    return [false, "Nil code"] if code.nil?

    if Experience.exists?(code: code)
      [false, "Experience already exists with code: #{code}"]
    else
      [true, "Valid code"]
    end
  end

  def self.find_by_code(code)
    find_by(code: code)
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

  def register_user(user)
    users << user
  end

  # Add a user to this experience with fingerprint
  def add_user(user)
    return if has_user?(user)

    experience_participants.create!(user: user)
  end

  def jwt_for_participant(user)
    Experiences::AuthService.jwt_for_participant(experience: self, user: user)
  end

end
