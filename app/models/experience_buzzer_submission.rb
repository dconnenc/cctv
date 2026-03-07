class ExperienceBuzzerSubmission < ApplicationRecord
  belongs_to :experience_block
  belongs_to :user
end
