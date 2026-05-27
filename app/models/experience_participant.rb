class ExperienceParticipant < ApplicationRecord
  belongs_to :experience
  belongs_to :user

  has_many :experience_participant_segments, dependent: :destroy
  has_many :experience_segments, through: :experience_participant_segments
  has_many :experience_poll_submissions, dependent: :destroy
  has_many :experience_question_submissions, dependent: :destroy
  has_many :experience_photo_upload_submissions, dependent: :destroy
  has_many :experience_buzzer_submissions, dependent: :destroy
  has_many :experience_minigame_submissions, dependent: :destroy
  has_many :experience_minigame_balloon_results, dependent: :destroy
  has_many :improv_suggestions, dependent: :destroy
  has_many :improv_votes, dependent: :destroy

  enum :status, { registered: "registered", active: "active" }
  enum :role, {
    audience: "audience",
    player: "player",
    moderator: "moderator",
    host: "host"
  }

  def segment_names
    experience_segments.pluck(:name)
  end
end
