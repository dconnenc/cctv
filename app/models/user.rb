class User < ApplicationRecord
  has_many :experience_participants, dependent: :destroy
  has_many :experiences, through: :experience_participants

  validates :name, presence: true, length: { minimum: 1, maximum: 255 }
end
