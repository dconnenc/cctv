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

    def block_visible_to_user?(block)
      role, segments = participant_role_and_segments
      visible_blocks = visible_blocks_for(role, segments)
      visible_blocks.include?(block)
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
      # Only show blocks to participants (those with a role) unless they are admin
      return [] if role.nil? && !admin?

      experience
        .experience_blocks # need ordering here
        .select { |block| block.open? || mod_or_host?(role) || admin? }
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
            # Default to participant visibility (since we already checked role.nil? above)
            true
          end
        end
    end

    def serialize_block(block, role)
      {
        id: block.id,
        kind: block.kind,
        status: block.status,
        payload: block.payload,
        responses: response_data_for(block, role)
      }.merge(visibility_payload(block, role))
    end

    def response_data_for(block, role)
      case block.kind
      when "poll"
        submissions = block.experience_poll_submissions
        total = submissions.count
        user_responded = user ? submissions.exists?(user_id: user.id) : false

        aggregate = {}
        if mod_or_host?(role) && total > 0
          # For poll blocks, aggregate the selected options
          submissions.each do |submission|
            selected_options = submission.answer["selectedOptions"] || []
            selected_options.each do |option|
              aggregate[option] ||= 0
              aggregate[option] += 1
            end
          end
        end

        {
          total: total,
          user_responded: user_responded,
          aggregate: mod_or_host?(role) ? aggregate : nil
        }
      when "question"
        submissions = block.experience_question_submissions
        total = submissions.count
        user_responded = user ? submissions.exists?(user_id: user.id) : false

        {
          total: total,
          user_responded: user_responded
        }
      when "multistep_form"
        submissions = block.experience_multistep_form_submissions
        total = submissions.count
        user_responded = user ? submissions.exists?(user_id: user.id) : false

        {
          total: total,
          user_responded: user_responded
        }
      when "announcement"
        {} # Announcements don't have responses
      else
        {}
      end
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

    def admin?
      user&.admin? || user&.superadmin?
    end
  end
end
