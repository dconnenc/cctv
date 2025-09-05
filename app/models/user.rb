class User < ApplicationRecord
  has_many :session_participants, dependent: :destroy
  has_many :sessions, through: :session_participants

  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
end
