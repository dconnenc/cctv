class EventPerformer < ApplicationRecord
  belongs_to :event
  belongs_to :performer

  validates :performer_id, uniqueness: { scope: :event_id }
end
