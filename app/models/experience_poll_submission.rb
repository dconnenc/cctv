class ExperiencePollSubmission < ApplicationRecord
  belongs_to :experience_block
  belongs_to :user

  validates :answer, presence: true
end
