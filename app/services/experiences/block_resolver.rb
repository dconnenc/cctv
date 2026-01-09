module Experiences
  class BlockResolver
    attr_reader :block, :participant, :submissions_cache

    def initialize(block:, participant:, submissions_cache: nil)
      @block = block
      @participant = participant
      @submissions_cache = submissions_cache
    end

    def self.resolve_variables(block:, participant:, submissions_cache: nil)
      new(block: block, participant: participant, submissions_cache: submissions_cache).resolve_variables
    end

    def self.next_unresolved_child(block:, participant:, submissions_cache: nil)
      new(block: block, participant: participant, submissions_cache: submissions_cache).next_unresolved_child
    end

    def resolve_variables
      return {} unless block.has_dependencies?

      resolved = {}

      block.variables.includes(:bindings, bindings: :source_block).each do |variable|
        binding = variable.bindings.first
        next unless binding

        value = extract_value_from_block(binding.source_block)
        resolved[variable.key] = value if value.present?
      end

      resolved
    end

    def next_unresolved_child
      return nil unless block.has_dependencies?

      block.children.find do |child|
        child_visible?(child) && !has_user_responded?(child)
      end
    end

    private

    def child_visible?(child)
      return true if moderator_or_host? || user_admin?
      return false unless block_visible_by_status?(child)
      rules_allow_block?(child)
    end

    def user_admin?
      participant.user.role == "admin" || participant.user.role == "superadmin"
    end

    def moderator_or_host?
      ["moderator", "host"].include?(participant.role.to_s)
    end

    def block_visible_by_status?(block)
      return true if block.open?
      return true if block.experience.status == "lobby" && block.show_in_lobby?
      false
    end

    def rules_allow_block?(block)
      return true if moderator_or_host?

      targeting_rules_exist = block.visible_to_roles.present? ||
        block.visible_to_segments.present? ||
        block.target_user_ids.present?

      return true unless targeting_rules_exist

      allowed_from_roles?(block) ||
        allowed_from_segments?(block) ||
        allowed_from_user_target?(block)
    end

    def allowed_from_roles?(block)
      block.visible_to_roles.include?(participant.role.to_s)
    end

    def allowed_from_segments?(block)
      (block.visible_to_segments & participant.segments).any?
    end

    def allowed_from_user_target?(block)
      (block.target_user_ids.map(&:to_s) & [participant.user_id.to_s]).any?
    end

    def extract_value_from_block(source_block)
      submission = find_submission(source_block)
      return nil unless submission

      case source_block.kind
      when ExperienceBlock::QUESTION
        submission.answer["value"]
      when ExperienceBlock::POLL
        submission.answer["selectedOptions"]&.first
      else
        nil
      end
    end

    def find_submission(source_block)
      if submissions_cache
        submissions_cache.dig(source_block.id, participant.user_id)
      else
        case source_block.kind
        when ExperienceBlock::QUESTION
          ExperienceQuestionSubmission.find_by(
            experience_block_id: source_block.id,
            user_id: participant.user_id
          )
        when ExperienceBlock::POLL
          ExperiencePollSubmission.find_by(
            experience_block_id: source_block.id,
            user_id: participant.user_id
          )
        when ExperienceBlock::MAD_LIB
          ExperienceMadLibSubmission.find_by(
            experience_block_id: source_block.id,
            user_id: participant.user_id
          )
        when ExperienceBlock::MULTISTEP_FORM
          ExperienceMultistepFormSubmission.find_by(
            experience_block_id: source_block.id,
            user_id: participant.user_id
          )
        else
          nil
        end
      end
    end

    def has_user_responded?(block)
      find_submission(block).present?
    end
  end
end
