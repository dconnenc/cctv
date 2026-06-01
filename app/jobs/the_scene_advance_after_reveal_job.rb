class TheSceneAdvanceAfterRevealJob < ApplicationJob
  queue_as :default

  discard_on ActiveRecord::RecordNotFound

  def perform(block_id, expected_scene_started_at)
    block = ExperienceBlock.find(block_id)
    return unless block.kind == ExperienceBlock::THE_SCENE

    payload = block.payload || {}
    return unless payload["phase"] == "winner_reveal"
    return unless payload["scene_started_at"] == expected_scene_started_at

    experience = block.experience

    Experiences::Orchestrator.new(experience: experience, actor: experience.creator)
      .start_next_scene!(block: block)

    Experiences::Broadcaster.new(experience).broadcast_experience_update
  end
end
