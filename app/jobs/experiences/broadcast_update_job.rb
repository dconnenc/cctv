class Experiences::BroadcastUpdateJob < ApplicationJob
  queue_as :default

  sidekiq_options lock: :until_executing,
                  lock_args_method: :lock_args,
                  on_conflict: { client: :log }

  def self.lock_args(args)
    [args.first]
  end

  def perform(experience_id)
    experience = Experience.find(experience_id)
    Experiences::Broadcaster.new(experience).broadcast_experience_update
  rescue ActiveRecord::RecordNotFound
    # experience deleted; nothing to broadcast
  end
end
