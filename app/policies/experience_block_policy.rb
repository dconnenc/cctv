class ExperienceBlockPolicy < ApplicationPolicy
  def submit_poll_response?
    user_allowed_to_interact_with_block?
  end

  def submit_question_response?
    user_allowed_to_interact_with_block?
  end

  def submit_photo_upload_response?
    user_allowed_to_interact_with_block?
  end

  def submit_buzzer_response?
    user_allowed_to_interact_with_block?
  end

  # The arithmetic round runs client-side and records answers best-effort; a
  # late answer landing after the block has closed must not 403. Any participant
  # in the experience may record an answer regardless of block status.
  def submit_minigame_arithmetic_response?
    return false unless user

    participant?
  end

  def submit_minigame_balloon_pump_update?
    user_allowed_to_interact_with_block?
  end

  def submit_the_scene_suggestion?
    user_allowed_to_interact_with_block?
  end

  def submit_the_scene_vote?
    user_allowed_to_interact_with_block?
  end

  def press_the_scene_buzzer?
    user_allowed_to_interact_with_block?
  end

  private

  def user_allowed_to_interact_with_block?
    return false unless user
    return false unless participant?
    return false unless block_visible_to_user?

    true
  end

  def participant?
    record.experience.has_user?(user)
  end

  def block_visible_to_user?
    Experiences::Visibility.block_visible_to_user?(
      block: record,
      user: user
    )
  end
end
