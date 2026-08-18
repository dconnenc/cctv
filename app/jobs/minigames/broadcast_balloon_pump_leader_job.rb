class Minigames::BroadcastBalloonPumpLeaderJob < ApplicationJob
  queue_as :default

  sidekiq_options lock: :until_executing,
                  lock_args_method: :lock_args,
                  on_conflict: { client: :log }

  def self.lock_args(args)
    [args.first]  # block_id
  end

  def perform(block_id)
    block = ExperienceBlock.find(block_id)
    payload = block.payload || {}
    return unless payload["started_at"].present? && payload["ended_at"].blank?

    Experiences::Broadcaster.new(block.experience).broadcast_balloon_pump_leader_update(
      block_id: block_id,
      leader_fill: payload["leader_fill"].to_i,
      leader_participant_id: payload["leader_participant_id"]
    )
  rescue ActiveRecord::RecordNotFound
  end
end
