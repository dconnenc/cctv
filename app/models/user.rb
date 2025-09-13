class User < ApplicationRecord
  has_many :experience_participants, dependent: :destroy
  has_many :experiences, through: :experience_participants
  has_many :created_experiences, class_name: "Experience", foreign_key: :creator_id, dependent: :destroy

  enum role: {
    member: "member",
    admin: "admin",
    superadmin: "superadmin"
  }

  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
  validates :email,
    presence: true,
    format: { with: URI::MailTo::EMAIL_REGEXP },
    uniqueness: { case_sensitive: false }

  passwordless_with :email

  before_save { self.email = email.downcase.strip }
end
