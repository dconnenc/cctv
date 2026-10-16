class Follow < ApplicationRecord
  include Tenanted

  belongs_to :user
  belongs_to :performer

  validates :performer_id, uniqueness: { scope: :user_id, message: "already followed" }
end
