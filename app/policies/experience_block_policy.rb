class ExperienceBlockPolicy < ApplicationPolicy
  def submit_poll_response?
    user_allowed_to_interact_with_block?
  end

  def submit_question_response?
    user_allowed_to_interact_with_block?
  end

  def submit_multistep_form_response?
    user_allowed_to_interact_with_block?
  end

  def submit_mad_lib_response?
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
