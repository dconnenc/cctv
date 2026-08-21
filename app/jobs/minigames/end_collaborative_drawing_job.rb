module Minigames
  class EndCollaborativeDrawingJob < ApplicationJob
    queue_as :default

    discard_on ActiveRecord::RecordNotFound

    def perform(block_id, expected_round_started_at_iso)
      block = ExperienceBlock.find(block_id)
      return unless block.kind == ExperienceBlock::COLLABORATIVE_DRAWING

      payload = block.payload || {}
      return if payload["ended_at"].present?
      return if payload["round_started_at"].blank?
      return if payload["round_started_at"] != expected_round_started_at_iso

      Experiences::Orchestrator.new(experience: block.experience, actor: nil)
        .end_collaborative_drawing_round!(block: block)

      Experiences::Broadcaster.enqueue_update(block.experience)
    end
  end
end
