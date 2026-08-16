module Minigames
  class ClearShowXJob < ApplicationJob
    queue_as :default

    discard_on ActiveRecord::RecordNotFound

    def perform(block_id)
      block = ExperienceBlock.find(block_id)
      return unless block.kind == ExperienceBlock::FAMILY_FEUD

      payload = block.payload || {}
      return unless payload.dig("game_state", "show_x")

      payload["game_state"]["show_x"] = false
      block.update!(payload: payload)

      Experiences::Broadcaster.enqueue_update(block.experience)
    end
  end
end
