module Experiences
  class Orchestrator < BaseService
    attr_reader :profile_changes
    def kick_participant!(participant_id)
      participant = experience.experience_participants.find(participant_id)
      participant.destroy!
    end

    def update_participant_avatar!(participant_id:, strokes:)
      participant = experience.experience_participants.find(participant_id)
      avatar = participant.avatar || {}
      avatar[:strokes] = strokes unless strokes.nil?
      participant.update!(avatar: avatar)
      participant
    end

    def add_block!(
      kind:,
      payload: {},
      visible_to_roles: [],
      target_user_ids: [],
      status: :hidden,
      open_immediately: false,
      show_in_lobby: false
    )
      transaction do
        max_position = experience.experience_blocks.parent_blocks.maximum(:position) || -1

        prepared_payload = prepare_block_payload(kind: kind, payload: payload)

        block = experience.experience_blocks.create!(
          kind: kind,
          status: status,
          payload: prepared_payload,
          visible_to_roles: visible_to_roles,
          target_user_ids: target_user_ids,
          position: max_position + 1
        )
        block.update!(status: :open) if open_immediately

        block
      end
    end

    def prepare_block_payload(kind:, payload:)
      payload = payload.deep_dup || {}

      case kind
      when ExperienceBlock::MINIGAME_ARITHMETIC
        question_count   = payload["question_count"].to_i
        duration_seconds = payload["duration_seconds"].to_i
        leaderboard_size = payload["leaderboard_size"].to_i

        raise ArgumentError, "question_count must be positive"   unless question_count.positive?
        raise ArgumentError, "duration_seconds must be positive" unless duration_seconds.positive?
        raise ArgumentError, "leaderboard_size must be positive" unless leaderboard_size.positive?

        payload["variant"]    = "arithmetic"
        payload["questions"]  = Minigames::ArithmeticQuestionGenerator.generate(count: question_count)
        payload["started_at"] = nil
        payload["ended_at"]   = nil
      when ExperienceBlock::MINIGAME_BALLOON_PUMP
        target_units = payload["target_units"].to_i
        raise ArgumentError, "target_units must be positive" unless target_units.positive?

        payload["variant"]                  = "balloon_pump"
        payload["target_units"]              = target_units
        payload["started_at"]                = nil
        payload["ended_at"]                  = nil
        payload["winner_participant_ids"]    = []
        payload["leader_fill"]               = 0
        payload["leader_participant_id"]     = nil
        payload["leader_last_broadcast_at"]  = nil
      when ExperienceBlock::THE_SCENE
        leaderboard_size = payload["leaderboard_size"].to_i
        raise ArgumentError, "leaderboard_size must be positive" unless leaderboard_size.positive?

        payload["leaderboard_size"] = leaderboard_size
        payload["phase"]            = "idle"
        payload["scene_started_at"] = nil
      end

      payload
    end

    def close_block!(block_id)
      block = experience.experience_blocks.find(block_id)
      block.close!
      block
    end

    def open_block!(block_id)
      block = experience.experience_blocks.find(block_id)
      block.open!
      start_guess_who!(block) if block.kind == ExperienceBlock::GUESS_WHO
      block
    end

    def hide_block!(block_id)
      block = experience.experience_blocks.find(block_id)
      block.hide!
      block
    end

    def reorder_block!(block_id:, position:)
      transaction do
        block = experience.experience_blocks.find(block_id)

        ids = block.siblings(include_self: true).order(:position, :created_at).pluck(:id)
        old_index = ids.index(block.id)
        new_index = position.clamp(0, ids.length - 1)

        return block if old_index == new_index

        ids.delete_at(old_index)
        ids.insert(new_index, block.id)

        ids.each_with_index do |id, idx|
          experience.experience_blocks.where(id: id).update_all(position: idx)
        end

        block.reload
      end
    end

    def set_block_column!(block_id:, column:)
      transaction do
        block = experience.experience_blocks.find(block_id)
        target = [column.to_i, 0].max
        block.update!(position: target) unless block.position == target
        block.reload
      end
    end

    def insert_block_column!(at_column:)
      transaction do
        bump_from = at_column.to_i
        experience
          .experience_blocks
          .parent_blocks
          .where("position >= ?", bump_from)
          .order(position: :desc)
          .each { |b| b.update!(position: b.position + 1) }
      end
    end

    def open_lobby!
      transaction do
        experience.update!(
          status: Experience.statuses[:lobby],
          join_open: true
        )
      end
    end

    def start!
      transaction do
        experience.update!(
          status: Experience.statuses[:live],
          started_at: DateTime.now,
          join_open: true
        )
      end
    end

    def pause!
      guard_state!([:live, :lobby])

      transaction do
        experience.update!(
          status: Experience.statuses[:paused]
        )
      end
    end

    def resume!
      guard_state!(:paused)

      transaction do
        experience.update!(
          status: Experience.statuses[:live]
        )
      end
    end

    def submit_poll_response!(block_id:, answer:)
      block = experience.experience_blocks.find(block_id)

      submission = ExperiencePollSubmission.find_or_initialize_by(
        experience_block_id: block.id,
        user_id: actor.id
      )

      old_selected = submission.persisted? ? Array(submission.answer&.dig("selectedOptions")) : []

      submission.answer = answer
      submission.save!

      apply_poll_segment_assignments(block, old_selected, Array(answer&.dig("selectedOptions")))

      submission
    end

    def submit_question_response!(block_id:, answer:)
      block = experience.experience_blocks.find(block_id)

      submission = ExperienceQuestionSubmission.find_or_initialize_by(
        experience_block_id: block.id,
        user_id: actor.id
      )

      submission.answer = answer
      submission.save!

      submission
    end

    def submit_mad_lib_response!(block_id:, answer:)
      block = experience.experience_blocks.find(block_id)

      submission = ExperienceMadLibSubmission.find_or_initialize_by(
        experience_block_id: block.id,
        user_id: actor.id
      )

      submission.answer = answer
      submission.save!

      submission
    end

    def submit_photo_upload_response!(block_id:, photo_signed_id:, answer: {})
      block = experience.experience_blocks.find(block_id)

      blob = ActiveStorage::Blob.find_signed!(photo_signed_id)

      submission = ExperiencePhotoUploadSubmission.find_or_initialize_by(
        experience_block_id: block.id,
        user_id: actor.id
      )

      submission.answer = answer

      if submission.new_record?
        submission.save!(validate: false)
        submission.photo.attach(blob)
      else
        submission.photo.attach(blob)
        submission.save!
      end

      submission
    end

    def submit_buzzer_response!(block_id:, answer:)
      block = experience.experience_blocks.find(block_id)

      submission = ExperienceBuzzerSubmission.find_or_initialize_by(
        experience_block_id: block.id,
        user_id: actor.id
      )

      return submission unless submission.new_record?

      submission.answer = answer
      submission.save!

      submission
    end

    def clear_buzzer_responses!(block_id:)
      block = experience.experience_blocks.find(block_id)
      block.experience_buzzer_submissions.delete_all

      block
    end

    def add_family_feud_bucket!(block_id:, question_id:, name:)
      question_block = experience.experience_blocks.find(question_id)

      transaction do
        question_payload = question_block.payload || {}
        question_payload["buckets"] ||= []

        new_bucket = {
          "id" => "bucket-#{Time.now.to_i}-#{SecureRandom.hex(4)}",
          "name" => name,
          "answer_ids" => []
        }

        question_payload["buckets"] << new_bucket
        question_block.update!(payload: question_payload)

        new_bucket
      end
    end

    def rename_family_feud_bucket!(block_id:, question_id:, bucket_id:, name:)
      question_block = experience.experience_blocks.find(question_id)

      transaction do
        question_payload = question_block.payload || {}
        buckets = question_payload["buckets"] || []

        bucket = buckets.find { |b| b["id"] == bucket_id }
        raise ActiveRecord::RecordNotFound, "Bucket not found" unless bucket

        bucket["name"] = name
        question_block.update!(payload: question_payload)

        bucket
      end
    end

    def delete_family_feud_bucket!(block_id:, question_id:, bucket_id:)
      question_block = experience.experience_blocks.find(question_id)

      transaction do
        question_payload = question_block.payload || {}
        buckets = question_payload["buckets"] || []

        question_payload["buckets"] = buckets.reject { |b| b["id"] == bucket_id }
        question_block.update!(payload: question_payload)

        true
      end
    end

    def auto_categorize_family_feud!(block_id:, question_id:)
      question_block = experience.experience_blocks.find(question_id)

      transaction do
        question_payload = question_block.payload || {}
        submissions = ExperienceQuestionSubmission.where(experience_block_id: question_block.id)

        raise ::AI::Client::Error, "No answers to categorize" if submissions.empty?

        question_text = question_payload["question"] || "Question"
        answers = submissions.map { |s| { id: s.id.to_s, text: s.answer.to_s } }

        prompt_builder = ::AI::Prompts::FamilyFeudBucketing.new(
          question_text: question_text,
          answers: answers
        )

        result = ::AI::Client.call(
          prompt: prompt_builder.prompt,
          response_schema: prompt_builder.response_schema
        )

        valid_ids = answers.map { |a| a[:id] }.to_set
        ai_buckets = result["buckets"] || []

        question_payload["buckets"] = ai_buckets.filter_map do |ai_bucket|
          filtered_ids = (ai_bucket["answer_ids"] || []).select { |id| valid_ids.include?(id) }
          next if filtered_ids.empty?

          {
            "id" => "bucket-#{Time.now.to_i}-#{SecureRandom.hex(4)}",
            "name" => ai_bucket["name"].to_s.truncate(50),
            "answer_ids" => filtered_ids
          }
        end

        question_block.update!(payload: question_payload)
        question_payload["buckets"]
      end
    end

    def assign_family_feud_answer!(block_id:, question_id:, answer_id:, bucket_id:)
      question_block = experience.experience_blocks.find(question_id)

      transaction do
        question_payload = question_block.payload || {}
        buckets = question_payload["buckets"] || []

        # Remove answer from all buckets first
        buckets.each do |bucket|
          bucket["answer_ids"]&.delete(answer_id)
        end

        # Add to target bucket if specified
        if bucket_id.present?
          target_bucket = buckets.find { |b| b["id"] == bucket_id }
          raise ActiveRecord::RecordNotFound, "Bucket not found" unless target_bucket

          target_bucket["answer_ids"] ||= []
          target_bucket["answer_ids"] << answer_id unless target_bucket["answer_ids"].include?(answer_id)
        end

        question_block.update!(payload: question_payload)
        true
      end
    end

    def start_family_feud_playing!(block_id:)
      block = experience.experience_blocks.find(block_id)

      transaction do
        current_payload = block.payload || {}

        questions = block.child_blocks.map do |child_block|
          buckets = child_block.payload["buckets"] || []

          submissions = ExperienceQuestionSubmission.where(experience_block_id: child_block.id)
          total_answers = submissions.count
          submission_ids = submissions.pluck(:id).map(&:to_s)

          question_buckets = buckets.map do |bucket|
            question_answer_ids = (bucket["answer_ids"] || []) & submission_ids
            answer_count = question_answer_ids.count
            percentage = total_answers > 0 ? ((answer_count.to_f / total_answers) * 100).round(1) : 0

            {
              "bucket_id" => bucket["id"],
              "bucket_name" => bucket["name"],
              "percentage" => percentage,
              "revealed" => false
            }
          end

          question_buckets.sort_by! { |b| -b["percentage"] }

          {
            "question_id" => child_block.id,
            "question_text" => child_block.payload["question"] || "Question",
            "buckets" => question_buckets
          }
        end

        current_payload["game_state"] = {
          "phase" => "playing",
          "current_question_index" => 0,
          "questions" => questions,
          "show_x" => false
        }

        block.update!(payload: current_payload)
        block
      end
    end

    def reveal_family_feud_bucket!(block_id:, question_index:, bucket_index:)
      block = experience.experience_blocks.find(block_id)

      transaction do
        current_payload = block.payload || {}
        game_state = current_payload["game_state"] || {}

        question = game_state.dig("questions", question_index)
        raise ActiveRecord::RecordNotFound, "Question not found" unless question

        bucket = question.dig("buckets", bucket_index)
        raise ActiveRecord::RecordNotFound, "Bucket not found" unless bucket

        bucket["revealed"] = true
        block.update!(payload: current_payload)

        block
      end
    end

    def show_family_feud_x!(block_id:)
      block = experience.experience_blocks.find(block_id)

      transaction do
        current_payload = block.payload || {}
        game_state = current_payload["game_state"] || {}

        game_state["show_x"] = true
        block.update!(payload: current_payload)

        block
      end
    end

    def next_family_feud_question!(block_id:)
      block = experience.experience_blocks.find(block_id)

      transaction do
        current_payload = block.payload || {}
        game_state = current_payload["game_state"] || {}

        current_index = game_state["current_question_index"] || 0
        questions = game_state["questions"] || []

        if current_index >= questions.length - 1
          block.update!(status: :closed)
        else
          game_state["current_question_index"] = current_index + 1
          block.update!(payload: current_payload)
        end

        block
      end
    end

    def restart_family_feud_playing!(block_id:)
      block = experience.experience_blocks.find(block_id)

      transaction do
        current_payload = block.payload || {}
        game_state = current_payload["game_state"] || {}

        if game_state["questions"]
          game_state["questions"].each do |question|
            question["buckets"]&.each do |bucket|
              bucket["revealed"] = false
            end
          end
        end

        game_state["current_question_index"] = 0
        game_state["show_x"] = false

        block.update!(payload: current_payload)
        block
      end
    end

    def restart_family_feud_categorizing!(block_id:)
      block = experience.experience_blocks.find(block_id)

      transaction do
        block.clear_family_feud_bucket_assignments!

        current_payload = block.payload || {}
        current_payload["game_state"] = {
          "phase" => "gathering"
        }

        block.update!(payload: current_payload)
        block
      end
    end

    def restart_family_feud_everything!(block_id:)
      block = experience.experience_blocks.find(block_id)

      transaction do
        child_block_ids = block.child_blocks.pluck(:id)
        ExperienceQuestionSubmission.where(experience_block_id: child_block_ids).delete_all

        block.clear_all_family_feud_buckets!

        current_payload = block.payload || {}
        current_payload["game_state"] = { "phase" => "gathering" }

        block.update!(payload: current_payload)
        block
      end
    end

    # GuessWho ----------------------------------------------------------------

    def start_guess_who!(block)
      payload = block.payload || {}
      return block if payload["user_a_id"].present? && payload["user_b_id"].present?

      segment_id = payload["segment_id"]
      raise ActiveRecord::RecordInvalid, block unless segment_id.present?

      transaction do
        pool = experience.experience_participants
          .joins(:experience_segments)
          .where(experience_segments: { id: segment_id })
          .where.not(role: %w[host moderator])

        sampled = pool.to_a.sample(2)

        if sampled.length < 2
          payload["error"] = "Need at least 2 audience members in the selected segment"
          block.update!(payload: payload)
          return block
        end

        user_a, user_b = sampled
        slides_a = ParticipantSubmissions.new(experience).for_user(user_a.user_id)
        slides_b = ParticipantSubmissions.new(experience).for_user(user_b.user_id)

        slides = interleave_slides(slides_a, user_a.user_id, slides_b, user_b.user_id)

        payload["user_a_id"] = user_a.user_id
        payload["user_b_id"] = user_b.user_id
        payload["slides"] = slides
        payload["current_slide_index"] = 0
        payload["revealed"] = false
        payload.delete("error")

        block.update!(payload: payload)
        block
      end
    end

    def next_guess_who_slide!(block_id:)
      adjust_guess_who_slide!(block_id, 1)
    end

    def previous_guess_who_slide!(block_id:)
      adjust_guess_who_slide!(block_id, -1)
    end

    def reveal_guess_who!(block_id:)
      block = experience.experience_blocks.find(block_id)
      transaction do
        payload = block.payload || {}
        payload["revealed"] = true
        block.update!(payload: payload)
      end
      block
    end

    # Minigame: arithmetic ----------------------------------------------------

    def start_minigame_arithmetic!(block_id:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not an arithmetic minigame" unless block.kind == ExperienceBlock::MINIGAME_ARITHMETIC

      transaction do
        payload = block.payload || {}

        unless payload["questions"].is_a?(Array) && payload["questions"].any?
          raise ArgumentError, "Minigame has no questions configured"
        end

        started_at = Time.current
        duration   = payload["duration_seconds"].to_i

        payload["started_at"] = started_at.iso8601
        payload["ended_at"]   = nil

        block.update!(payload: payload, status: :open)

        Minigames::EndArithmeticJob.set(wait: duration.seconds)
          .perform_later(block.id, payload["started_at"])

        block
      end
    end

    def end_minigame_arithmetic!(block_id:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not an arithmetic minigame" unless block.kind == ExperienceBlock::MINIGAME_ARITHMETIC

      transaction do
        payload = block.payload || {}
        return block if payload["ended_at"].present?

        payload["ended_at"] = Time.current.iso8601
        block.update!(payload: payload, status: :closed)
      end

      block
    end

    def submit_minigame_arithmetic_response!(block_id:, question_index:, answer:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not an arithmetic minigame" unless block.kind == ExperienceBlock::MINIGAME_ARITHMETIC

      payload = block.payload || {}
      raise Experiences::InvalidTransitionError, "Minigame has not started" if payload["started_at"].blank?
      raise Experiences::InvalidTransitionError, "Minigame has ended"       if payload["ended_at"].present?

      questions = Array(payload["questions"])
      index     = question_index.to_i
      question  = questions[index]
      raise ActiveRecord::RecordNotFound, "Question not found" unless question

      submitted_text = answer.to_s.strip
      parsed         = Integer(submitted_text, exception: false)
      correct        = parsed.present? && parsed == question["answer"].to_i

      submission = ExperienceMinigameSubmission.find_or_initialize_by(
        experience_block_id: block.id,
        user_id:             actor.id,
        question_index:      index
      )

      return submission if submission.persisted?

      submission.submitted_answer = submitted_text
      submission.correct          = correct
      submission.submitted_at     = Time.current
      submission.save!
      submission
    end

    # Minigame: balloon pump --------------------------------------------------

    def start_minigame_balloon_pump!(block_id:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not a balloon pump minigame" unless block.kind == ExperienceBlock::MINIGAME_BALLOON_PUMP

      transaction do
        payload                              = block.payload || {}
        payload["started_at"]                = Time.current.iso8601
        payload["ended_at"]                  = nil
        payload["winner_participant_ids"]    = []
        payload["leader_fill"]               = 0
        payload["leader_participant_id"]     = nil
        payload["leader_last_broadcast_at"]  = nil

        block.experience_minigame_balloon_results.delete_all
        block.update!(payload: payload, status: :open)
      end

      block
    end

    def end_minigame_balloon_pump!(block_id:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not a balloon pump minigame" unless block.kind == ExperienceBlock::MINIGAME_BALLOON_PUMP

      transaction do
        payload = block.payload || {}
        return block if payload["ended_at"].present?

        payload["ended_at"] = Time.current.iso8601
        block.update!(payload: payload, status: :closed)
      end

      block
    end

    # Hot path. Returns a hash describing the resulting state so the controller
    # can decide what (if anything) to broadcast.
    #
    # @return [Hash] :result — :accepted, :ignored
    #                :winners — array of ExperienceParticipant when game just ended
    #                :leader_changed — true if the leader for monitor display moved
    def submit_balloon_pump_update!(block_id:, fill_amount:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not a balloon pump minigame" unless block.kind == ExperienceBlock::MINIGAME_BALLOON_PUMP

      payload      = block.payload || {}
      target_units = payload["target_units"].to_i
      requested    = fill_amount.to_i.clamp(0, target_units)

      return { result: :ignored } if payload["started_at"].blank?
      return { result: :ignored } if payload["ended_at"].present?

      participant = experience.experience_participants.find_by(user_id: actor.id)
      raise ActiveRecord::RecordNotFound, "Participant not found" unless participant

      result = ExperienceMinigameBalloonResult
        .where(experience_block_id: block.id, user_id: actor.id)
        .first_or_initialize

      return { result: :ignored } if result.persisted? && result.fill_amount >= requested

      result.fill_amount = [result.fill_amount, requested].max
      result.save!

      crossed_target = result.fill_amount >= target_units
      leader_changed = false
      winners        = []

      if crossed_target
        winners = close_balloon_pump_with_winners!(block, target_units)
      else
        leader_changed = update_balloon_pump_leader!(block, participant, result.fill_amount)
      end

      { result: :accepted, winners: winners, leader_changed: leader_changed }
    end

    # The Scene -------------------------------------------------------------

    SCENE_PHASES = %w[idle collecting voting ended].freeze

    def advance_the_scene_phase!(block_id:, phase:)
      raise ArgumentError, "Unknown phase: #{phase}" unless SCENE_PHASES.include?(phase.to_s)

      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not a Scene" unless block.kind == ExperienceBlock::THE_SCENE

      transaction do
        payload = block.payload || {}
        payload["phase"] = phase.to_s

        # First time we leave idle, stamp scene_started_at so votes scope cleanly.
        if payload["phase"] != "idle" && payload["scene_started_at"].blank?
          payload["scene_started_at"] = Time.current.iso8601(6)
        end

        new_status =
          case payload["phase"]
          when "idle"   then :hidden
          when "ended"  then :closed
          else               :open
          end

        block.update!(payload: payload, status: new_status)
      end

      block
    end

    def start_next_scene!(block_id:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not a Scene" unless block.kind == ExperienceBlock::THE_SCENE

      transaction do
        payload = block.payload || {}
        prior = payload["scene_started_at"]
        candidate = Time.current.iso8601(6)

        # Guarantee strict monotonic increase even if the host clicks
        # twice in the same microsecond.
        if prior.present? && candidate <= prior
          candidate = (Time.iso8601(prior) + 0.001.seconds).iso8601(6)
        end

        payload["phase"]            = "collecting"
        payload["scene_started_at"] = candidate
        block.update!(payload: payload, status: :open)
      end

      block
    end

    def submit_the_scene_suggestion!(block_id:, text:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not a Scene" unless block.kind == ExperienceBlock::THE_SCENE

      payload = block.payload || {}
      raise Experiences::InvalidTransitionError, "Scene is not collecting suggestions" unless %w[collecting voting].include?(payload["phase"])

      trimmed = text.to_s.strip
      raise ArgumentError, "Suggestion cannot be blank" if trimmed.empty?
      raise ArgumentError, "Suggestion is too long (#{ImprovSuggestion::MAX_LENGTH} max)" if trimmed.length > ImprovSuggestion::MAX_LENGTH

      transaction do
        existing = block.improv_suggestions.active.find_by(user_id: actor.id)
        raise Experiences::InvalidTransitionError, "You already submitted this scene" if existing

        block.improv_suggestions.create!(user_id: actor.id, text: trimmed)
      end
    end

    def submit_the_scene_vote!(block_id:, suggestion_id:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not a Scene" unless block.kind == ExperienceBlock::THE_SCENE

      payload = block.payload || {}
      raise Experiences::InvalidTransitionError, "Voting is not open" unless payload["phase"] == "voting"

      scene_started_at = payload["scene_started_at"]
      raise Experiences::InvalidTransitionError, "Scene has not started" if scene_started_at.blank?

      suggestion = block.improv_suggestions.active.find(suggestion_id)
      raise ArgumentError, "Cannot vote for your own suggestion" if suggestion.user_id == actor.id

      transaction do
        vote = ImprovVote
          .where(experience_block_id: block.id, user_id: actor.id, scene_started_at: scene_started_at)
          .first_or_initialize

        vote.improv_suggestion_id = suggestion.id
        vote.save!
        vote
      end
    end

    def clear_the_scene_top!(block_id:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not a Scene" unless block.kind == ExperienceBlock::THE_SCENE

      top = TheScene::Tally.top(block: block, scene_started_at: block.payload["scene_started_at"])&.first
      return block unless top

      top.clear!
      block
    end

    def clear_the_scene_suggestion!(block_id:, suggestion_id:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not a Scene" unless block.kind == ExperienceBlock::THE_SCENE

      suggestion = block.improv_suggestions.active.find(suggestion_id)
      suggestion.clear!
      block
    end

    def clear_the_scene_all!(block_id:)
      block = experience.experience_blocks.find(block_id)
      raise ArgumentError, "Block is not a Scene" unless block.kind == ExperienceBlock::THE_SCENE

      block.improv_suggestions.active.update_all(cleared_at: Time.current)
      block
    end

    # -----------------------------------------------------------------------

    def update_block!(block_id:, payload:, visible_to_segment_ids:, variables: nil, questions: nil)
      transaction do
        block = experience.experience_blocks.find(block_id)
        safety_check_edit!(block, payload)

        block.update!(payload: payload)

        block.experience_block_segments.delete_all
        if visible_to_segment_ids.any?
          ExperienceBlockSegment.insert_all(
            visible_to_segment_ids.map { |sid| { experience_block_id: block.id, experience_segment_id: sid } }
          )
        end

        if block.kind == ExperienceBlock::MAD_LIB && variables.present?
          block.variables.destroy_all
          variables.each do |v|
            block.variables.create!(
              key: v[:key], label: v[:label], datatype: v[:datatype],
              required: v.fetch(:required, true)
            )
          end
        end

        if block.kind == ExperienceBlock::FAMILY_FEUD && questions.present?
          questions.each do |q|
            child = block.child_blocks.find_by(id: q[:id])
            next unless child
            child.update!(payload: child.payload.merge("question" => q[:question]))
          end
        end

        block
      end
    end

    def add_block_with_dependencies!(
      kind:,
      payload: {},
      visible_to_roles: [],
      target_user_ids: [],
      status: :hidden,
      variables: [],
      questions: []
    )
      transaction do
        max_position = experience.experience_blocks.parent_blocks.maximum(:position) || -1

        parent_block = experience.experience_blocks.create!(
          kind: kind,
          status: status,
          payload: payload.except(:variables, :questions),
          visible_to_roles: visible_to_roles,
          target_user_ids: target_user_ids,
          position: max_position + 1
        )

        if kind == ExperienceBlock::FAMILY_FEUD && questions.present?
          questions.each_with_index do |question_spec, index|
            create_family_feud_question(
              parent_block: parent_block,
              question_spec: question_spec,
              position: index
            )
          end
        else
          variables.each_with_index do |var_spec, index|
            variable = parent_block.variables.create!(
              key: var_spec["key"],
              label: var_spec["label"],
              datatype: var_spec["datatype"] || "string",
              required: var_spec["required"].nil? ? true : var_spec["required"]
            )

            if var_spec["source"]
              child_block = if var_spec["source"]["type"] == "participant"
                create_participant_source_block(
                  parent_block: parent_block,
                  variable: variable,
                  participant_id: var_spec["source"]["participant_id"],
                  question: var_spec["source"]["question"],
                  position: index
                )
              else
                create_child_block(
                  parent_block: parent_block,
                  source_spec: var_spec["source"],
                  position: index
                )
              end

              ExperienceBlockVariableBinding.create!(
                variable: variable,
                source_block_id: child_block.id
              )
            end
          end
        end

        parent_block
      end
    end

    private

    def close_balloon_pump_with_winners!(block, target_units)
      transaction do
        block.lock!
        payload = block.payload || {}
        return [] if payload["ended_at"].present?

        winning_results = ExperienceMinigameBalloonResult
          .where(experience_block_id: block.id)
          .where("fill_amount >= ?", target_units)
          .to_a

        winning_user_ids = winning_results.map(&:user_id)
        winners = experience.experience_participants
          .includes(:user)
          .where(user_id: winning_user_ids)
          .to_a

        payload["ended_at"]               = Time.current.iso8601
        payload["winner_participant_ids"] = winners.map(&:id)
        payload["leader_fill"]            = target_units
        payload["leader_participant_id"]  = winners.first&.id

        block.update!(payload: payload, status: :closed)
        winners
      end
    end

    def update_balloon_pump_leader!(block, participant, fill_amount)
      payload      = block.payload || {}
      target_units = payload["target_units"].to_i
      return false if target_units.zero?

      current_leader_fill = payload["leader_fill"].to_i

      return false if fill_amount < current_leader_fill
      return false if fill_amount == current_leader_fill && payload["leader_participant_id"] == participant.id

      block.update_columns(
        payload: payload.merge(
          "leader_fill"            => fill_amount,
          "leader_participant_id"  => participant.id
        ),
        updated_at: Time.current
      )

      true
    end

    def adjust_guess_who_slide!(block_id, delta)
      block = experience.experience_blocks.find(block_id)
      transaction do
        payload = block.payload || {}
        slides = Array(payload["slides"])
        current = payload["current_slide_index"].to_i
        target = (current + delta).clamp(0, [slides.length - 1, 0].max)
        payload["current_slide_index"] = target
        block.update!(payload: payload)
      end
      block
    end

    def interleave_slides(list_a, user_a_id, list_b, user_b_id)
      tagged_a = list_a.map { |e| e.merge(user_id: user_a_id, slot: "a") }
      tagged_b = list_b.map { |e| e.merge(user_id: user_b_id, slot: "b") }

      slides = []
      max = [tagged_a.length, tagged_b.length].max
      max.times do |i|
        slides << tagged_a[i] if tagged_a[i]
        slides << tagged_b[i] if tagged_b[i]
      end
      slides
    end

    def create_participant_source_block(parent_block:, variable:, participant_id:, question:, position:)
      participant = experience.experience_participants.find(participant_id)

      child_block = experience.experience_blocks.create!(
        kind: ExperienceBlock::QUESTION,
        status: parent_block.status,
        payload: {
          question: question.presence || variable.label,
          formKey: variable.key,
          inputType: variable.datatype == "number" ? "number" : "text"
        },
        visible_to_roles: parent_block.visible_to_roles,
        target_user_ids: [participant.user_id],
        parent_block_id: parent_block.id,
        position: position
      )

      copy_block_segments(from: parent_block, to: child_block)

      ExperienceBlockLink.create!(
        parent_block: parent_block,
        child_block: child_block,
        relationship: :depends_on
      )

      child_block
    end

    def create_child_block(parent_block:, source_spec:, position:)
      child_block = experience.experience_blocks.create!(
        kind: source_spec["kind"],
        status: parent_block.status,
        payload: source_spec["payload"] || {},
        visible_to_roles: parent_block.visible_to_roles,
        target_user_ids: source_spec["target_user_ids"] || [],
        parent_block_id: parent_block.id,
        position: position
      )

      copy_block_segments(from: parent_block, to: child_block)

      ExperienceBlockLink.create!(
        parent_block: parent_block,
        child_block: child_block,
        relationship: :depends_on
      )

      child_block
    end

    def create_family_feud_question(parent_block:, question_spec:, position:)
      child_block = experience.experience_blocks.create!(
        kind: ExperienceBlock::QUESTION,
        status: parent_block.status,
        payload: question_spec["payload"] || {},
        visible_to_roles: parent_block.visible_to_roles,
        target_user_ids: [],
        parent_block_id: parent_block.id,
        position: position,
        show_in_lobby: true
      )

      copy_block_segments(from: parent_block, to: child_block)

      ExperienceBlockLink.create!(
        parent_block: parent_block,
        child_block: child_block,
        relationship: :depends_on
      )

      child_block
    end

    def apply_poll_segment_assignments(block, old_selected, new_selected)
      assignments = block.payload&.dig("segmentAssignments")
      return if assignments.blank?

      participant = experience.experience_participants
        .includes(:experience_segments)
        .find_by(user_id: actor.id)
      return unless participant

      old_fingerprint = Experiences::Broadcaster.visibility_fingerprint(experience, participant)
      @profile_changes ||= []

      removed_options = old_selected - new_selected
      segments_to_remove = removed_options.filter_map { |opt| assignments[opt] }
      if segments_to_remove.any?
        ExperienceParticipantSegment
          .where(experience_participant_id: participant.id, experience_segment_id: segments_to_remove)
          .delete_all
      end

      added_options = new_selected - old_selected
      segments_to_add = added_options.filter_map { |opt| assignments[opt] }
      if segments_to_add.any?
        existing = ExperienceParticipantSegment
          .where(experience_participant_id: participant.id, experience_segment_id: segments_to_add)
          .pluck(:experience_segment_id)

        new_segments = segments_to_add - existing
        if new_segments.any?
          ExperienceParticipantSegment.insert_all(
            new_segments.map { |sid| { experience_participant_id: participant.id, experience_segment_id: sid } }
          )
        end
      end

      @profile_changes << { participant: participant, old_fingerprint: old_fingerprint }
    end

    def copy_block_segments(from:, to:)
      segment_ids = from.experience_segment_ids
      return if segment_ids.empty?

      ExperienceBlockSegment.insert_all(
        segment_ids.map { |sid| { experience_block_id: to.id, experience_segment_id: sid } }
      )
    end

    def safety_check_edit!(block, new_payload)
      case block.kind
      when ExperienceBlock::POLL
        if block.experience_poll_submissions.exists?
          old_opts = Array(block.payload["options"]).sort
          new_opts = Array(new_payload["options"]).sort
          block.experience_poll_submissions.delete_all if old_opts != new_opts
        end
      when ExperienceBlock::MAD_LIB
        if block.experience_mad_lib_submissions.exists?
          if block.status == "open"
            raise Experiences::UnsafeEditError,
              "Cannot edit a Mad Lib while it is active."
          else
            block.experience_mad_lib_submissions.delete_all
            child_ids = block.child_blocks.pluck(:id)
            ExperienceQuestionSubmission.where(experience_block_id: child_ids).delete_all
          end
        end
      end
    end

    def guard_state!(allowed)
      return if Array(allowed).map(&:to_s).include?(experience.status)

      raise(
        Experiences::InvalidTransitionError,
        "Need #{Array(allowed).join('|')} but was #{experience.status}"
      )
    end
  end
end
