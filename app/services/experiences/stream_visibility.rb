module Experiences
  # PURPOSE:
  # Calculates what experience blocks should be visible for a given role/segment
  # combination. Used for efficient WebSocket broadcasting where we want to
  # calculate visibility once per logical stream, not once per participant.
  #
  # USE CASES:
  # - WebSocket broadcasting to logical streams (role:player:segments:vip+premium)
  # - Calculating visibility for representative participants in streams
  # - Efficient bulk visibility calculations when User objects aren't available
  #
  # INPUTS:
  # - experience: The Experience object
  # - role: Participant role symbol (:host, :player, :audience, :moderator)
  # - segments: Array of segment strings the stream represents
  # - target_user_ids: Array of user IDs for individual targeting (optional)
  #
  # BLOCK VISIBILITY LOGIC (IDENTICAL TO Visibility):
  # - Closed blocks: Only visible to moderators/hosts/admin roles
  # - Blocks with targeting rules: Must match role OR segments OR target_user_ids
  # - Blocks without targeting rules: Visible to all participants
  # - No role (nil): See nothing unless admin role
  class StreamVisibility < VisibilityBase
    attr_reader :experience, :role, :segments, :target_user_ids

    def initialize(experience:, role:, segments: [], target_user_ids: [])
      @experience = experience
      @role = role
      @segments = segments || []
      @target_user_ids = target_user_ids || []
    end

    def payload
      blocks = visible_blocks_for(@role, @segments, @target_user_ids)
      base_experience_payload(blocks.map { |block| serialize_block(block, @role) })
    end

    def block_visible_to_stream?(block)
      visible_blocks = visible_blocks_for(@role, @segments, @target_user_ids)
      visible_blocks.include?(block)
    end

    private

    def visible_blocks_for(role, segments, target_user_ids)
      super(role, segments, target_user_ids, admin_role?)
    end

    def serialize_block(block, role)
      serialize_block_for_stream(block, role)
    end



    def admin_role?
      role.to_s == "admin" || role.to_s == "superadmin"
    end

    # Required by VisibilityBase
    attr_reader :experience
  end
end
