module Experiences
  # PURPOSE:
  # Calculates what experience blocks a specific User should see, taking into account:
  # - The user's participant role and segments within the experience
  # - Individual user targeting rules on blocks
  # - User-specific response data (their own poll answers, etc.)
  #
  # USE CASES:
  # - API controllers serving individual user requests
  # - ActionCable initial state when user first subscribes
  # - Individual block visibility checks (e.g., can this user submit to this block?)
  #
  # INPUTS:
  # - experience: The Experience object
  # - user: A specific User object
  #
  # BLOCK VISIBILITY LOGIC:
  # - Closed blocks: Only visible to moderators/hosts/admins
  # - Blocks with targeting rules: Must match role OR segments OR individual user targeting
  # - Blocks without targeting rules: Visible to all participants
  # - Non-participants: See nothing (unless admin/superadmin)
  #
  # INDIVIDUAL USER TARGETING:
  # Uses actual user.id to check if blocks specifically target this user
  class Visibility < VisibilityBase
    attr_reader :user, :experience
    def initialize(experience:, user:)
      @experience = experience
      @user = user
    end

    def payload
      role, segments = participant_role_and_segments
      blocks = visible_blocks_for(role, segments)

      base_experience_payload(blocks.map { |block| serialize_block(block, role) })
    end

    def block_visible_to_user?(block)
      role, segments = participant_role_and_segments
      visible_blocks = visible_blocks_for(role, segments)
      visible_blocks.include?(block)
    end

    def participant_role_and_segments
      return [nil, []] if user.nil?

      participant_record = experience
        .experience_participants
        .find_by(user_id: user.id)

      return [nil, []] if participant_record.nil?

      [
        (participant_record.role.to_sym),
        (participant_record.segments || [])
      ]
    end

    private

    def visible_blocks_for(role, segments)
      target_user_ids = user ? [user.id] : []
      super(role, segments, target_user_ids, admin?)
    end

    def serialize_block(block, role)
      serialize_block_for_user(block, role, user)
    end



    def admin?
      user&.admin? || user&.superadmin?
    end

    # Required by VisibilityBase
    attr_reader :experience
  end
end
