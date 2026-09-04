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

  # The photo intake is decoupled from the active block segment — any participant
  # may contribute a photo whether or not the block is currently their visible
  # block. Mirrors the arithmetic pattern: participant-only, status-independent.
  def submit_collaborative_drawing_photo?
    return false unless user

    participant?
  end

  # A drawing is submitted on tap or when the client timer expires; a late
  # dispatch landing after the round closes must not 403.
  def submit_collaborative_drawing?
    return false unless user

    participant?
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
