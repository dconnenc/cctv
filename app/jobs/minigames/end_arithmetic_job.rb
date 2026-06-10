module Minigames
  class EndArithmeticJob < ApplicationJob
    queue_as :default

    discard_on ActiveRecord::RecordNotFound

    def perform(block_id, expected_started_at_iso)
      block = ExperienceBlock.find(block_id)
      return unless block.kind == ExperienceBlock::MINIGAME_ARITHMETIC

      payload = block.payload || {}
      return if payload["ended_at"].present?
      return if payload["started_at"].blank?
      return if payload["started_at"] != expected_started_at_iso

      # End the round but keep the block open so the monitor keeps showing it
      # (now displaying the leaderboard). The admin closes the block when done.
      payload["ended_at"] = Time.current.iso8601
      block.update!(payload: payload)

      Experiences::Broadcaster.new(block.experience).broadcast_experience_update
    end
  end
end
