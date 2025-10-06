module Experiences
  class BlockResolver
    attr_reader :block, :participant

    def initialize(block:, participant:)
      @block = block
      @participant = participant
    end

    def self.resolve_variables(block:, participant:)
      new(block: block, participant: participant).resolve_variables
    end

    def self.next_unresolved_child(block:, participant:)
      new(block: block, participant: participant).next_unresolved_child
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
      Experiences::Visibility.block_visible_to_user?(
        block: child,
        user: participant.user
      )
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

    def has_user_responded?(block)
      find_submission(block).present?
    end
  end
end
