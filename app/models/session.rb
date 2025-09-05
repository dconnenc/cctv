class Session < ApplicationRecord
  has_many :session_participants, dependent: :destroy
  has_many :users, through: :session_participants

  validates :code, presence: true, uniqueness: true, length: { minimum: 1, maximum: 255 }

  # Convenience method to find session by code
  def self.find_by_code(code)
    find_by(code: code)
  end

  # Generate a random session code
  def self.generate_code
    SecureRandom.alphanumeric(8).upcase
  end

  # Check if a user has joined this session
  def has_user?(user)
    users.include?(user)
  end

  # Add a user to this session
  def add_user(user)
    users << user unless has_user?(user)
  end
end
