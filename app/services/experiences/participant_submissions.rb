module Experiences
  # Returns every submission (across all kinds) made by a single user inside an
  # experience. Used by the manage-page submissions drawer and by the
  # GuessWho block to snapshot a player's contributions into slides.
  class ParticipantSubmissions
    def initialize(experience)
      @experience = experience
    end

    def for_user(user_id)
      block_ids = @experience.experience_blocks.pluck(:id)
      blocks_by_id = @experience.experience_blocks.includes(:parent_block).index_by(&:id)

      entries = []
      entries.concat(poll_entries(user_id, block_ids, blocks_by_id))
      entries.concat(question_entries(user_id, block_ids, blocks_by_id))
      entries.concat(mad_lib_entries(user_id, block_ids, blocks_by_id))
      entries.concat(photo_upload_entries(user_id, block_ids, blocks_by_id))
      entries.concat(buzzer_entries(user_id, block_ids, blocks_by_id))

      entries.sort_by { |e| [e[:position], e[:submitted_at]] }
    end

    private

    def poll_entries(user_id, block_ids, blocks_by_id)
      ExperiencePollSubmission.where(experience_block_id: block_ids, user_id: user_id).map do |s|
        block = blocks_by_id[s.experience_block_id]
        options = Array(block.payload&.dig("options"))
        selected = Array(s.answer&.dig("selectedOptions"))
        labels = selected.map { |sel| option_label(options, sel) }.compact

        build_entry(
          block: block,
          blocks_by_id: blocks_by_id,
          kind: ExperienceBlock::POLL,
          prompt: block.payload&.dig("question").to_s,
          answer: { text: labels.join(", "), options: labels, raw: s.answer },
          submitted_at: s.created_at
        )
      end
    end

    def question_entries(user_id, block_ids, blocks_by_id)
      ExperienceQuestionSubmission.where(experience_block_id: block_ids, user_id: user_id).map do |s|
        block = blocks_by_id[s.experience_block_id]
        text  = answer_text(s.answer)

        build_entry(
          block: block,
          blocks_by_id: blocks_by_id,
          kind: ExperienceBlock::QUESTION,
          prompt: block.payload&.dig("question").to_s,
          answer: { text: text, raw: s.answer },
          submitted_at: s.created_at
        )
      end
    end

    def mad_lib_entries(user_id, block_ids, blocks_by_id)
      ExperienceMadLibSubmission.where(experience_block_id: block_ids, user_id: user_id).map do |s|
        block = blocks_by_id[s.experience_block_id]

        build_entry(
          block: block,
          blocks_by_id: blocks_by_id,
          kind: ExperienceBlock::MAD_LIB,
          prompt: block.payload&.dig("title").to_s.presence || "Mad Lib",
          answer: { text: format_mad_lib(s.answer), raw: s.answer },
          submitted_at: s.created_at
        )
      end
    end

    def photo_upload_entries(user_id, block_ids, blocks_by_id)
      submissions = ExperiencePhotoUploadSubmission
        .where(experience_block_id: block_ids, user_id: user_id)
        .includes(photo_attachment: :blob)

      submissions.map do |s|
        block = blocks_by_id[s.experience_block_id]
        url = s.photo.attached? ? ActiveStorageUrlService.blob_url(s.photo.blob) : nil

        build_entry(
          block: block,
          blocks_by_id: blocks_by_id,
          kind: ExperienceBlock::PHOTO_UPLOAD,
          prompt: block.payload&.dig("prompt").to_s,
          answer: { text: nil, raw: s.answer },
          photo_url: url,
          submitted_at: s.created_at
        )
      end
    end

    def buzzer_entries(user_id, block_ids, blocks_by_id)
      ExperienceBuzzerSubmission.where(experience_block_id: block_ids, user_id: user_id).map do |s|
        block = blocks_by_id[s.experience_block_id]
        buzzed_at = s.answer.is_a?(Hash) ? s.answer["buzzed_at"] : nil

        build_entry(
          block: block,
          blocks_by_id: blocks_by_id,
          kind: ExperienceBlock::BUZZER,
          prompt: block.payload&.dig("prompt").to_s.presence ||
                  block.payload&.dig("label").to_s.presence ||
                  "Buzzer",
          answer: { text: "Buzzed in", buzzed_at: buzzed_at, raw: s.answer },
          submitted_at: s.created_at
        )
      end
    end

    def build_entry(block:, blocks_by_id:, kind:, prompt:, answer:, submitted_at:, photo_url: nil)
      {
        block_id: block.id,
        block_kind: kind,
        position: parent_position(block, blocks_by_id),
        prompt: prompt,
        answer: answer,
        photo_url: photo_url,
        submitted_at: submitted_at
      }
    end

    def parent_position(block, blocks_by_id)
      current = block
      while current.parent_block_id && blocks_by_id[current.parent_block_id]
        current = blocks_by_id[current.parent_block_id]
      end
      current.position
    end

    def option_label(options, selected)
      idx = Integer(selected, exception: false)
      return options[idx] if idx && options[idx]

      options.find { |o| o == selected } || selected.to_s
    end

    def answer_text(answer)
      return answer if answer.is_a?(String)
      return answer["value"].to_s if answer.is_a?(Hash) && answer["value"]

      answer.to_s
    end

    def format_mad_lib(answer)
      return answer if answer.is_a?(String)
      return nil unless answer.is_a?(Hash)

      answer.map { |k, v| "#{k}: #{v}" }.join(" / ")
    end
  end
end
