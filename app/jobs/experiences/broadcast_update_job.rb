class Experiences::BroadcastUpdateJob < ApplicationJob
  queue_as :broadcasts

  discard_on ActiveRecord::RecordNotFound

  sidekiq_options lock: :until_executing,
                  lock_args_method: :lock_args,
                  on_conflict: { client: :log }

  def self.lock_args(args)
    [args.first]
  end

  def perform(experience_id)
    experience = Experience.find(experience_id)
    Experiences::Broadcaster.new(experience).broadcast_experience_update
  end
end
