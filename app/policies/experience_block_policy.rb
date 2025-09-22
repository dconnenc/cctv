class ExperienceBlockPolicy < ApplicationPolicy
  def submit_poll_response?
    return false unless user
    return false unless participant?
    return false unless block_visible_to_user?
    
    true
  end

  private

  def participant?
    record.experience.has_user?(user)
  end

  def block_visible_to_user?
    visibility_service = Experiences::Visibility.new(
      experience: record.experience,
      user: user
    )
    
    visibility_service.block_visible_to_user?(record)
  end
end