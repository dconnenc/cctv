# frozen_string_literal: true

module Experiences
  # Base Visibility Logic - Shared Experience Block Filtering
  #
  # PURPOSE:
  # Contains the core block visibility logic shared between user-centric (Visibility)
  # and stream-centric (StreamVisibility) services. This eliminates duplication while
  # preserving the distinct responsibilities of each service.
  #
  # SHARED LOGIC:
  # - Block status filtering (open/closed based on role)
  # - Targeting rule evaluation (roles, segments, user IDs)
  # - Block serialization structure
  # - Role/permission checking helpers
  #
  # BLOCK VISIBILITY ALGORITHM:
  # 1. Filter by status: closed blocks only visible to moderators/hosts/admins
  # 2. Check targeting rules: blocks with targeting must match at least one rule
  # 3. Role targeting: block.visible_to_roles includes participant role
  # 4. Segment targeting: block.visible_to_segments intersects with participant segments
  # 5. User targeting: block.target_user_ids intersects with target users
  # 6. Default visibility: blocks without targeting rules are visible to all participants
  #
  class VisibilityBase < BaseService
    protected

    # Core visibility filtering logic
    # @param role [Symbol, String, nil] Participant role
    # @param segments [Array<String>] Participant segments
    # @param target_user_ids [Array<String, Integer>] Target user IDs for individual targeting
    # @param admin_check [Boolean] Whether this represents an admin (role-based or user-based)
    def visible_blocks_for(role, segments, target_user_ids, admin_check)
      # Only show blocks to participants (those with a role) unless they are admin
      return [] if role.nil? && !admin_check

      experience
        .experience_blocks
        .select { |block| block.open? || mod_or_host?(role) || admin_check }
        .select { |block| block_visible_for_targeting?(block, role, segments, target_user_ids) }
    end

    def block_visible_for_targeting?(block, role, segments, target_user_ids)
      targeting_rules_exist = block.visible_to_roles.present? ||
        block.visible_to_segments.present? ||
        block.target_user_ids.present?

      if targeting_rules_exist
        allowed_from_roles = block.visible_to_roles.include?(role.to_s)
        allowed_from_segments = (block.visible_to_segments & segments).any?
        allowed_from_user_target = (block.target_user_ids & target_user_ids.map(&:to_s)).any?

        allowed_from_roles || allowed_from_segments || allowed_from_user_target
      else
        # Default to participant visibility (since we already checked role.nil? above)
        true
      end
    end

    # Use BlockSerializer for consistent block serialization
    def serialize_block_for_user(block, role, user)
      BlockSerializer.serialize_for_user(block, role: role, user: user)
    end

    def serialize_block_for_stream(block, role)
      BlockSerializer.serialize_for_stream(block, role: role)
    end



    def base_experience_payload(blocks)
      {
        experience: {
          id: experience.id,
          code: experience.code,
          status: experience.status,
          started_at: experience.started_at,
          ended_at: experience.ended_at,
          blocks: blocks
        }
      }
    end

    # Role permission checking
    def mod_or_host?(role)
      ["moderator", "host"].include?(role.to_s)
    end

    private

    # Must be implemented by subclasses
    def experience
      raise NotImplementedError, "Subclasses must implement #experience"
    end
  end
end
