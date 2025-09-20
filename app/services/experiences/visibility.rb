module Experiences
  class Visibility < BaseService
    attr_reader :user, :experience
    def initialize(experience:, user:)
      @experience = experience
      @user = user
    end

    def payload
      role, segments = participant_role_and_segments
      blocks = visible_blocks_for(role, segments)

      {
        experience: {
          id: @experience.id,
          code: @experience.code,
          status: @experience.status,
          started_at: @experience.started_at,
          ended_at: @experience.ended_at,
          blocks: blocks.map { |block| serialize_block(block, role) }
        },
      }
    end

    private

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

    def visible_blocks_for(role, segments)
      experience
        .experience_blocks # need ordering here
        .select { |block| block.open? || mod_or_host?(role) }
        .select do |block|
          targeting_rules_exist = block.visible_to_roles.present? ||
            block.visible_to_segments.present? ||
            block.target_user_ids.present?

          if targeting_rules_exist
            allowed_from_roles    = block.visible_to_roles.include?(role.to_s)
            allowed_from_segments = (block.visible_to_segments & segments).any?
            allowed_from_user_target = block.target_user_ids.include?(user&.id)

            allowed_from_roles ||
              allowed_from_segments ||
              allowed_from_user_target
          else
            # Default to global visibility
            true
          end
        end
    end

    def serialize_block(block, role)
      {
        id: block.id,
        kind: block.kind,
        status: block.status,
        payload: block.payload
      }.merge(visibility_payload(block, role))
    end

    def visibility_payload(block, role)
      return {} unless mod_or_host?(role)

      {
        visible_to_roles: block.visible_to_roles,
        visible_to_segments: block.visible_to_segments,
      }
    end

    def mod_or_host?(role)
      ["moderator", "host"].include?(role.to_s)
    end
  end
end
