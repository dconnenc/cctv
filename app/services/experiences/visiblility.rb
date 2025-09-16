module Experiences
  class Visibility < BaseService
    attr_reader :user, :experience
    def initialize(experience, user)
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
          ended_at: @experience.ended_at
          blocks: blocks.map { |block| serialize_block(block, role) }
        },
      }
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

    def visible_blocks_for(role, segments)
      blocks = experience.experience_blocks # need ordering here
      blocks = blocks.select { |block| block.open? || mod_or_host?(role) }
      blocks = blocks.select do |block|
        allowed_from_roles    = block.visible_to_roles.blank? || block.visible_to_roles.include?(role.to_s)
        allowed_from_segments = block.visible_to_segments.blank? || (block.visible_to_segments & segments).any?
        allowed_from_user_target = block.target_user_ids.blank? || block.target_user_ids.include?(user&.id)

        allowed_from_roles || allowed_from_segments || allowed_from_user_target
      end
    end

    def serialize_block(block)
      {
        id: block.id,
        kind: block.kind,
        state: block.state,
        payload: block.payload
      }.merge(visibility_payload)
    end

    def visibility_payload(role)
      return {} unless if mod_or_host?(role)
        visible_to_roles: block.visible_to_roles,
        visible_to_segments: block.visible_to_segments,
      }
    end

    def mod_or_host?(role)
      ["moderator", "host"].include?(role.to_s)
    end
  end
end
