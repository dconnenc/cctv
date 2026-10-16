class ExperienceBlockSegment < ApplicationRecord
  include Tenanted

  belongs_to :experience_block
  belongs_to :experience_segment
end
