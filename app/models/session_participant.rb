class SessionParticipant < ApplicationRecord
  belongs_to :user
  belongs_to :session

  validates :user_id, uniqueness: { scope: :session_id }
end
