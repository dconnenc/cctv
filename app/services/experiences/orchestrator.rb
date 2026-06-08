module Experiences
  class Orchestrator < BaseService
    # A real Family Feud board shows at most 8 answers.
    MAX_FAMILY_FEUD_BUCKETS = 8

    attr_reader :profile_changes
    def kick_participant!(participant)
      participant.destroy!
    end

    def update_participant_avatar!(participant:, strokes:)
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
      show_in_lobby: false,
      add_to_playbill: false,
      playbill_mysterious: false
    )
      transaction do
        max_position = experience.experience_blocks.maximum(:position) || -1

        prepared_payload = prepare_block_payload(kind: kind, payload: payload)

        block = experience.experience_blocks.create!(
          kind: kind,
          status: status,
          payload: prepared_payload,
          visible_to_roles: visible_to_roles,
          target_user_ids: target_user_ids,
          position: max_position + 1,
          add_to_playbill: add_to_playbill,
          playbill_mysterious: add_to_playbill && playbill_mysterious
        )

        if kind == ExperienceBlock::GUESS_WHO
          contestant_segment = create_guess_who_contestant_segment!(block)
          updated_payload = block.payload.merge("contestant_segment_id" => contestant_segment.id)
          block.update!(payload: updated_payload)
        end

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

        prompt_input_count = payload["prompt_input_count"].present? ? payload["prompt_input_count"].to_i : 3
        raise ArgumentError, "prompt_input_count must be positive" unless prompt_input_count.positive?

        performer_ids = Array(payload["performer_participant_ids"]).map(&:to_s).uniq

        payload["leaderboard_size"]          = leaderboard_size
        payload["prompt_input_count"]        = prompt_input_count
        payload["performer_participant_ids"] = performer_ids
        payload["prompt_participant_ids"]    = []
        payload["buzzer_participant_id"]     = nil
        payload["phase"]                     = "idle"
        payload["scene_started_at"]          = nil
        payload["winner_revealed_at"]        = nil
      when ExperienceBlock::GUESS_WHO
        payload["eligibility_threshold"] ||= 0.10
        payload["monitor_view"]            = "idle"
        payload["revealed"]                = false
        payload["started"]                 = false
        payload["active_poll_block_id"]    = nil
        payload["active_poll_contestant_index"] = nil
        payload["contestants"]             = []
      end

      payload
    end

    def close_block!(block:)
      block.close!
      block
    end

    def open_block!(block:)
      block.open!
      block
    end

    def hide_block!(block:)
      block.hide!
      block
    end

    def delete_block!(block_id)
      block = experience.experience_blocks.find(block_id)
      block.destroy!
      block
    end

    def detach_block_from_parent!(block_id)
      block = experience.experience_blocks.find(block_id)
      return block if block.parent_block_id.nil?

      transaction do
        block.parent_links.destroy_all
        block.update!(parent_block_id: nil)
        block
      end
    end

    def reorder_block!(block:, position:)
      transaction do
        ids = experience.experience_blocks.order(:position, :created_at).pluck(:id)
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

    def set_block_column!(block:, column:)
      transaction do
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

    def submit_poll_response!(block:, answer:)

      submission = ExperiencePollSubmission.find_or_initialize_by(
        experience_block_id: block.id,
        experience_participant: current_participant
      )

      old_selected = submission.persisted? ? Array(submission.answer&.dig("selectedOptions")) : []

      submission.answer = answer
      submission.save!

      apply_poll_segment_assignments(block, old_selected, Array(answer&.dig("selectedOptions")))

      submission
    end

    def submit_question_response!(block:, answer:)

      submission = ExperienceQuestionSubmission.find_or_initialize_by(
        experience_block_id: block.id,
        experience_participant: current_participant
      )

      submission.answer = answer
      submission.save!

      submission
    end

    def submit_photo_upload_response!(block:, photo_signed_id:, answer: {})

      blob = ActiveStorage::Blob.find_signed!(photo_signed_id)

      submission = ExperiencePhotoUploadSubmission.find_or_initialize_by(
        experience_block_id: block.id,
        experience_participant: current_participant
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

    def submit_buzzer_response!(block:, answer:)

      submission = ExperienceBuzzerSubmission.find_or_initialize_by(
        experience_block_id: block.id,
        experience_participant: current_participant
      )

      return submission unless submission.new_record?

      submission.answer = answer
      submission.save!

      submission
    end

    def clear_buzzer_responses!(block:)
      block.experience_buzzer_submissions.delete_all
      block
    end

    def add_family_feud_bucket!(question_id:, name:)
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

    def rename_family_feud_bucket!(question_id:, bucket_id:, name:)
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

    def delete_family_feud_bucket!(question_id:, bucket_id:)
      question_block = experience.experience_blocks.find(question_id)

      transaction do
        question_payload = question_block.payload || {}
        buckets = question_payload["buckets"] || []

        question_payload["buckets"] = buckets.reject { |b| b["id"] == bucket_id }
        question_block.update!(payload: question_payload)

        true
      end
    end

    def update_family_feud_ai_context!(block:, ai_context:)
      payload = block.payload || {}
      block.update!(payload: payload.merge("ai_context" => ai_context.to_s.strip))
    end

    def update_family_feud_question_ai_context!(question_id:, ai_context:)
      question_block = experience.experience_blocks.find(question_id)
      payload = question_block.payload || {}
      question_block.update!(payload: payload.merge("ai_context" => ai_context.to_s.strip))
    end

    def auto_categorize_family_feud!(question_id:)
      question_block = experience.experience_blocks.find(question_id)

      transaction do
        question_payload = question_block.payload || {}
        submissions = ExperienceQuestionSubmission.where(experience_block_id: question_block.id)

        raise ::AI::Client::Error, "No answers to categorize" if submissions.empty?

        question_text = question_payload["question"] || "Question"
        answers = submissions.map { |s| { id: s.id.to_s, text: s.answer.to_s } }

        parent_payload = question_block.parent_block&.payload || {}

        prompt_builder = ::AI::Prompts::FamilyFeudBucketing.new(
          question_text: question_text,
          answers: answers,
          game_context: parent_payload["ai_context"],
          question_context: question_payload["ai_context"]
        )

        result = ::AI::Client.call(
          prompt: prompt_builder.prompt,
          response_schema: prompt_builder.response_schema
        )

        valid_ids = answers.map { |a| a[:id] }.to_set
        ai_buckets = result["buckets"] || []

        built = ai_buckets.filter_map do |ai_bucket|
          filtered_ids = (ai_bucket["answer_ids"] || []).select { |id| valid_ids.include?(id) }
          next if filtered_ids.empty?

          {
            "id" => "bucket-#{Time.now.to_i}-#{SecureRandom.hex(4)}",
            "name" => ai_bucket["name"].to_s.truncate(50),
            "answer_ids" => filtered_ids
          }
        end

        question_payload["buckets"] = cap_family_feud_buckets(built)

        question_block.update!(payload: question_payload)
        question_payload["buckets"]
      end
    end

    def assign_family_feud_answer!(question_id:, answer_id:, bucket_id:)
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

    def start_family_feud_playing!(block:)
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

    def reveal_family_feud_bucket!(block:, question_index:, bucket_index:)
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

    def show_family_feud_x!(block:)
      transaction do
        current_payload = block.payload || {}
        game_state = current_payload["game_state"] || {}

        game_state["show_x"] = true
        block.update!(payload: current_payload)

        block
      end
    end

    def set_family_feud_theme_music!(block:, playing:)
      transaction do
        current_payload = block.payload || {}
        current_payload["theme_music_playing"] = playing
        block.update!(payload: current_payload)

        block
      end
    end

    def next_family_feud_question!(block:)
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

    def restart_family_feud_playing!(block:)
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

    def restart_family_feud_categorizing!(block:)
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

    def restart_family_feud_everything!(block:)
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

    GUESS_WHO_MONITOR_VIEWS = %w[idle c1_clue c1_board c2_clue c2_board reveal].freeze

    def start_guess_who!(block:)
      guard_guess_who!(block)

      transaction do
        payload = block.payload.deep_dup
        contestant_user_ids = guess_who_contestant_user_ids(payload)

        if contestant_user_ids.length != 2
          raise Experiences::InvalidTransitionError,
            "Guess Who requires exactly 2 contestants in the contestant segment (currently #{contestant_user_ids.length})"
        end

        pool_user_ids = guess_who_pool_user_ids(payload, contestant_user_ids)
        eligible_user_ids = filter_by_eligibility(pool_user_ids, payload["eligibility_threshold"].to_f)
        eligible_user_ids = pool_user_ids if eligible_user_ids.length < 2

        mystery_a, mystery_b = pick_two_distinct(eligible_user_ids, exclude: contestant_user_ids)

        if mystery_a.nil? || mystery_b.nil?
          raise Experiences::InvalidTransitionError, "Need at least 2 eligible participants for Guess Who"
        end

        board_candidate_ids = pool_user_ids
        payload["contestants"] = [
          build_guess_who_contestant(contestant_user_ids[0], mystery_a, board_candidate_ids),
          build_guess_who_contestant(contestant_user_ids[1], mystery_b, board_candidate_ids)
        ]
        payload["started"] = true
        payload["revealed"] = false
        payload["monitor_view"] = "idle"
        payload["active_poll_block_id"] = nil
        payload["active_poll_contestant_index"] = nil

        block.update!(payload: payload)
      end

      block
    end

    def reroll_guess_who_mystery!(block:, contestant_index:)
      guard_guess_who!(block)
      idx = contestant_index.to_i
      raise ArgumentError, "contestant_index must be 0 or 1" unless [0, 1].include?(idx)

      transaction do
        payload = block.payload.deep_dup
        contestants = Array(payload["contestants"])
        raise Experiences::InvalidTransitionError, "Guess Who has not started" if contestants.length != 2

        contestant_user_ids = guess_who_contestant_user_ids(payload)
        pool_user_ids = guess_who_pool_user_ids(payload, contestant_user_ids)
        eligible_user_ids = filter_by_eligibility(pool_user_ids, payload["eligibility_threshold"].to_f)
        eligible_user_ids = pool_user_ids if eligible_user_ids.length < 2

        other_mystery = contestants[1 - idx]["mystery_user_id"]
        own_contestant = contestants[idx]["contestant_user_id"]
        candidates = eligible_user_ids - [own_contestant, other_mystery, contestants[idx]["mystery_user_id"]].compact

        new_mystery = candidates.sample
        new_mystery ||= (pool_user_ids - [own_contestant, other_mystery, contestants[idx]["mystery_user_id"]].compact).sample
        raise Experiences::InvalidTransitionError, "No eligible mystery participants available" if new_mystery.nil?

        board_candidate_ids = pool_user_ids
        contestants[idx] = build_guess_who_contestant(own_contestant, new_mystery, board_candidate_ids)
        payload["contestants"] = contestants

        block.update!(payload: payload)
      end

      block
    end

    def curate_guess_who_clues!(block:, contestant_index:, clue_order:, hidden_clue_ids: [])
      guard_guess_who!(block)
      idx = contestant_index.to_i
      raise ArgumentError, "contestant_index must be 0 or 1" unless [0, 1].include?(idx)

      transaction do
        payload = block.payload.deep_dup
        contestants = Array(payload["contestants"])
        raise Experiences::InvalidTransitionError, "Guess Who has not started" if contestants.length != 2

        clues = Array(contestants[idx]["clues"])
        clues_by_id = clues.index_by { |c| c["id"] }
        ordered_ids = Array(clue_order).select { |id| clues_by_id.key?(id) }
        leftover = clues.reject { |c| ordered_ids.include?(c["id"]) }
        reordered = ordered_ids.map { |id| clues_by_id[id] } + leftover

        hidden_set = Array(hidden_clue_ids).to_set
        reordered.each { |c| c["hidden"] = hidden_set.include?(c["id"]) }

        contestants[idx]["clues"] = reordered
        contestants[idx]["current_clue_index"] = 0
        payload["contestants"] = contestants

        block.update!(payload: payload)
      end

      block
    end

    def advance_guess_who_clue!(block:, contestant_index:, direction:)
      guard_guess_who!(block)
      idx = contestant_index.to_i
      delta = direction.to_i
      raise ArgumentError, "contestant_index must be 0 or 1" unless [0, 1].include?(idx)

      transaction do
        payload = block.payload.deep_dup
        contestants = Array(payload["contestants"])
        raise Experiences::InvalidTransitionError, "Guess Who has not started" if contestants.length != 2

        clues = Array(contestants[idx]["clues"]).reject { |c| c["hidden"] }
        max_index = [clues.length - 1, 0].max
        current = contestants[idx]["current_clue_index"].to_i
        contestants[idx]["current_clue_index"] = (current + delta).clamp(0, max_index)

        payload["contestants"] = contestants
        block.update!(payload: payload)
      end

      block
    end

    def set_guess_who_monitor_view!(block:, view:)
      guard_guess_who!(block)
      raise ArgumentError, "Invalid monitor view: #{view}" unless GUESS_WHO_MONITOR_VIEWS.include?(view.to_s)

      transaction do
        payload = block.payload.deep_dup
        payload["monitor_view"] = view.to_s
        block.update!(payload: payload)
      end

      block
    end

    def dispatch_guess_who_poll!(block:, contestant_index:)
      guard_guess_who!(block)
      idx = contestant_index.to_i
      raise ArgumentError, "contestant_index must be 0 or 1" unless [0, 1].include?(idx)

      transaction do
        payload = block.payload.deep_dup
        raise Experiences::InvalidTransitionError, "Guess Who has not started" unless payload["started"]
        raise Experiences::InvalidTransitionError, "A poll is already active" if payload["active_poll_block_id"].present?

        next_position = experience.experience_blocks.maximum(:position).to_i + 1
        poll_block = experience.experience_blocks.create!(
          kind: ExperienceBlock::POLL,
          status: :open,
          payload: {
            "question" => "True or False?",
            "options" => ["True", "False"],
            "pollType" => "single",
            "guess_who_parent_id" => block.id,
            "target_contestant_index" => idx
          },
          visible_to_roles: [],
          target_user_ids: [],
          parent_block_id: block.id,
          position: next_position
        )
        ExperienceBlockLink.create!(
          parent_block: block,
          child_block: poll_block,
          relationship: :depends_on
        )

        payload["active_poll_block_id"] = poll_block.id
        payload["active_poll_contestant_index"] = idx
        block.update!(payload: payload)
      end

      block
    end

    def conclude_guess_who_poll!(block:)
      guard_guess_who!(block)

      transaction do
        payload = block.payload.deep_dup
        poll_id = payload["active_poll_block_id"]
        idx = payload["active_poll_contestant_index"].to_i
        raise Experiences::InvalidTransitionError, "No active poll" if poll_id.blank?

        poll_block = experience.experience_blocks.find(poll_id)
        contestants = Array(payload["contestants"])
        contestant = contestants[idx]
        mystery_user_id = contestant["mystery_user_id"]

        candidate_ids = Array(contestant["board_candidate_ids"])
        already_eliminated = Array(contestant["eliminated_user_ids"]).to_set
        active_candidates = candidate_ids - already_eliminated.to_a - [mystery_user_id]

        relevant_user_ids = ([mystery_user_id] + active_candidates).compact
        participant_by_user_id = experience.experience_participants
          .where(user_id: relevant_user_ids)
          .index_by(&:user_id)

        mystery_participant = participant_by_user_id[mystery_user_id]
        mystery_submission = mystery_participant && ExperiencePollSubmission.find_by(
          experience_block_id: poll_id,
          experience_participant_id: mystery_participant.id
        )
        mystery_answer = Array(mystery_submission&.answer&.dig("selectedOptions")).first

        active_participant_ids = active_candidates.map { |uid| participant_by_user_id[uid]&.id }.compact
        submissions_by_participant_id = ExperiencePollSubmission
          .where(experience_block_id: poll_id, experience_participant_id: active_participant_ids)
          .index_by(&:experience_participant_id)

        new_eliminated = already_eliminated.dup
        new_unanswered = Array(contestant["unanswered_user_ids"]).to_set

        active_candidates.each do |uid|
          participant = participant_by_user_id[uid]
          submission = participant && submissions_by_participant_id[participant.id]
          answer = Array(submission&.answer&.dig("selectedOptions")).first

          if answer.nil?
            new_unanswered.add(uid)
          else
            new_unanswered.delete(uid)
            if mystery_answer && answer != mystery_answer
              new_eliminated.add(uid)
            end
          end
        end

        contestant["eliminated_user_ids"] = new_eliminated.to_a
        contestant["unanswered_user_ids"] = new_unanswered.to_a
        contestants[idx] = contestant
        payload["contestants"] = contestants
        payload["active_poll_block_id"] = nil
        payload["active_poll_contestant_index"] = nil

        block.update!(payload: payload)
        poll_block.update!(status: :closed)
      end

      block
    end

    def reveal_guess_who!(block:)
      guard_guess_who!(block)
      transaction do
        payload = block.payload.deep_dup
        payload["revealed"] = true
        payload["monitor_view"] = "reveal"
        block.update!(payload: payload)
      end
      block
    end

    # Minigame: arithmetic ----------------------------------------------------

    def start_minigame_arithmetic!(block:)
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

    def end_minigame_arithmetic!(block:)
      raise ArgumentError, "Block is not an arithmetic minigame" unless block.kind == ExperienceBlock::MINIGAME_ARITHMETIC

      transaction do
        payload = block.payload || {}
        return block if payload["ended_at"].present?

        payload["ended_at"] = Time.current.iso8601
        block.update!(payload: payload, status: :closed)
      end

      block
    end

    def submit_minigame_arithmetic_response!(block:, question_index:, answer:)
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
        experience_block_id:     block.id,
        experience_participant:  current_participant,
        question_index:          index
      )

      return submission if submission.persisted?

      submission.submitted_answer = submitted_text
      submission.correct          = correct
      submission.submitted_at     = Time.current
      submission.save!
      submission
    end

    # Minigame: balloon pump --------------------------------------------------

    def start_minigame_balloon_pump!(block:)
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

    def end_minigame_balloon_pump!(block:)
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
    def submit_balloon_pump_update!(block:, fill_amount:)
      raise ArgumentError, "Block is not a balloon pump minigame" unless block.kind == ExperienceBlock::MINIGAME_BALLOON_PUMP

      payload      = block.payload || {}
      target_units = payload["target_units"].to_i
      requested    = fill_amount.to_i.clamp(0, target_units)

      return { result: :ignored } if payload["started_at"].blank?
      return { result: :ignored } if payload["ended_at"].present?

      participant = current_participant

      result = ExperienceMinigameBalloonResult
        .where(experience_block_id: block.id, experience_participant: participant)
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

    SCENE_PHASES = %w[idle collecting winner_reveal ended].freeze
    WINNER_REVEAL_DELAY_SECONDS = 15

    def start_the_scene!(block:)
      guard_the_scene!(block)

      transaction do
        payload = block.payload.deep_dup || {}
        payload["phase"] = "collecting"
        payload["scene_started_at"] = next_scene_stamp(payload["scene_started_at"])
        payload["winner_revealed_at"] = nil
        assign_scene_roles!(payload)
        block.update!(payload: payload, status: :open)
      end

      block
    end

    def press_the_scene_buzzer!(block:)
      guard_the_scene!(block)

      payload = block.payload || {}
      raise Experiences::InvalidTransitionError, "Buzzer is not active" unless payload["phase"] == "collecting"

      participant = current_participant
      raise Experiences::ForbiddenError, "Only the buzzer holder can press the buzzer" unless payload["buzzer_participant_id"] == participant.id

      active_count = block.improv_suggestions.active.where(created_at: scene_window(payload)).count
      raise Experiences::InvalidTransitionError, "Need at least 2 suggestions before ending the scene" if active_count < 2

      scene_stamp = nil
      transaction do
        updated = block.payload.deep_dup
        updated["phase"] = "winner_reveal"
        updated["winner_revealed_at"] = Time.current.iso8601(6)
        scene_stamp = updated["scene_started_at"]
        block.update!(payload: updated, status: :open)
      end

      TheSceneAdvanceAfterRevealJob.set(wait: WINNER_REVEAL_DELAY_SECONDS.seconds)
        .perform_later(block.id, scene_stamp)

      block
    end

    def force_next_scene!(block:)
      guard_the_scene!(block)
      start_next_scene!(block: block)
    end

    def end_the_scene!(block:)
      guard_the_scene!(block)

      transaction do
        payload = block.payload.deep_dup
        payload["phase"] = "ended"
        payload["prompt_participant_ids"] = []
        payload["buzzer_participant_id"] = nil
        block.update!(payload: payload, status: :closed)
      end

      block
    end

    def update_the_scene_performers!(block:, performer_participant_ids:)
      guard_the_scene!(block)

      ids = Array(performer_participant_ids).map(&:to_s).uniq
      valid_ids = experience.experience_participants.where(id: ids).pluck(:id).map(&:to_s)

      transaction do
        payload = block.payload.deep_dup
        payload["performer_participant_ids"] = valid_ids

        if %w[collecting].include?(payload["phase"])
          prompts = Array(payload["prompt_participant_ids"]).map(&:to_s) - valid_ids
          buzzer  = payload["buzzer_participant_id"]
          buzzer  = nil if valid_ids.include?(buzzer.to_s)
          payload["prompt_participant_ids"] = prompts
          payload["buzzer_participant_id"]  = buzzer

          if prompts.empty? || buzzer.nil?
            assign_scene_roles!(payload)
          end
        end

        block.update!(payload: payload)
      end

      block
    end

    def start_next_scene!(block:)
      guard_the_scene!(block)

      transaction do
        payload = block.payload.deep_dup || {}
        payload["phase"]              = "collecting"
        payload["scene_started_at"]   = next_scene_stamp(payload["scene_started_at"])
        payload["winner_revealed_at"] = nil
        assign_scene_roles!(payload)
        block.update!(payload: payload, status: :open)
      end

      block
    end

    def submit_the_scene_suggestion!(block:, text:)
      guard_the_scene!(block)

      payload = block.payload || {}
      raise Experiences::InvalidTransitionError, "Scene is not collecting suggestions" unless payload["phase"] == "collecting"

      participant = current_participant
      eligible_ids = Array(payload["prompt_participant_ids"]).map(&:to_s)
      raise Experiences::ForbiddenError, "You are not selected to submit a prompt this scene" unless eligible_ids.include?(participant.id)

      trimmed = text.to_s.strip
      raise ArgumentError, "Suggestion cannot be blank" if trimmed.empty?
      raise ArgumentError, "Suggestion is too long (#{ImprovSuggestion::MAX_LENGTH} max)" if trimmed.length > ImprovSuggestion::MAX_LENGTH

      transaction do
        existing = block.improv_suggestions.active
          .where(created_at: scene_window(payload))
          .find_by(experience_participant: participant)

        if existing
          existing.update!(text: trimmed)
          existing
        else
          block.improv_suggestions.create!(experience_participant: participant, text: trimmed)
        end
      end
    end

    def submit_the_scene_vote!(block:, suggestion_id:)
      guard_the_scene!(block)

      payload = block.payload || {}
      raise Experiences::InvalidTransitionError, "Voting is not open" unless payload["phase"] == "collecting"

      participant = current_participant
      raise Experiences::ForbiddenError, "Buzzer holder cannot vote" if payload["buzzer_participant_id"] == participant.id

      scene_started_at = payload["scene_started_at"]
      raise Experiences::InvalidTransitionError, "Scene has not started" if scene_started_at.blank?

      active_count = block.improv_suggestions.active.where(created_at: scene_window(payload)).count
      raise Experiences::InvalidTransitionError, "Voting opens once 2 suggestions are in" if active_count < 2

      suggestion = block.improv_suggestions.active.find(suggestion_id)
      raise ArgumentError, "Cannot vote for your own suggestion" if suggestion.experience_participant_id == participant.id

      transaction do
        vote = ImprovVote
          .where(experience_block_id: block.id, experience_participant: participant, scene_started_at: scene_started_at)
          .first_or_initialize

        vote.improv_suggestion_id = suggestion.id
        vote.save!
        vote
      end
    end

    def clear_the_scene_top!(block:)
      raise ArgumentError, "Block is not a Scene" unless block.kind == ExperienceBlock::THE_SCENE

      top = TheScene::Tally.top(block: block, scene_started_at: block.payload["scene_started_at"])&.first
      return block unless top

      top.clear!
      block
    end

    def clear_the_scene_suggestion!(block:, suggestion_id:)
      raise ArgumentError, "Block is not a Scene" unless block.kind == ExperienceBlock::THE_SCENE

      suggestion = block.improv_suggestions.active.find(suggestion_id)
      suggestion.clear!
      block
    end

    def clear_the_scene_all!(block:)
      raise ArgumentError, "Block is not a Scene" unless block.kind == ExperienceBlock::THE_SCENE

      block.improv_suggestions.active.update_all(cleared_at: Time.current)
      block
    end

    # -----------------------------------------------------------------------

    def update_block!(block:, payload:, visible_to_segment_ids:, questions: nil)
      transaction do
        safety_check_edit!(block, payload)

        block.update!(payload: payload)

        block.experience_block_segments.delete_all
        if visible_to_segment_ids.any?
          ExperienceBlockSegment.insert_all(
            visible_to_segment_ids.map { |sid| { experience_block_id: block.id, experience_segment_id: sid } }
          )
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
      questions: [],
      add_to_playbill: false,
      playbill_mysterious: false
    )
      transaction do
        max_position = experience.experience_blocks.maximum(:position) || -1

        parent_block = experience.experience_blocks.create!(
          kind: kind,
          status: status,
          payload: payload.except(:questions),
          sounds: default_sounds_for(kind),
          visible_to_roles: visible_to_roles,
          target_user_ids: target_user_ids,
          position: max_position + 1,
          add_to_playbill: add_to_playbill,
          playbill_mysterious: add_to_playbill && playbill_mysterious
        )

        if kind == ExperienceBlock::FAMILY_FEUD && questions.present?
          questions.each_with_index do |question_spec, index|
            create_family_feud_question(
              parent_block: parent_block,
              question_spec: question_spec,
              position: max_position + 2 + index
            )
          end
        end

        parent_block
      end
    end

    private

    # Cap the board at the most popular MAX_FAMILY_FEUD_BUCKETS buckets (by member
    # count), preserving order; overflow buckets' answers fall back to unassigned.
    def cap_family_feud_buckets(buckets)
      return buckets if buckets.length <= MAX_FAMILY_FEUD_BUCKETS

      keep = buckets.each_index
                    .sort_by { |i| [-buckets[i]["answer_ids"].length, i] }
                    .first(MAX_FAMILY_FEUD_BUCKETS)
                    .to_set
      buckets.select.with_index { |_, i| keep.include?(i) }
    end

    def guard_the_scene!(block)
      raise ArgumentError, "Block is not a Scene" unless block.kind == ExperienceBlock::THE_SCENE
    end

    def next_scene_stamp(prior)
      candidate = Time.current.iso8601(6)
      return candidate if prior.blank?
      return candidate if candidate > prior
      (Time.iso8601(prior) + 0.001.seconds).iso8601(6)
    end

    def scene_window(payload)
      start = payload["scene_started_at"]
      return (Time.at(0)..) if start.blank?
      Time.iso8601(start)..
    end

    def assign_scene_roles!(payload)
      performers = Array(payload["performer_participant_ids"]).map(&:to_s).to_set
      prompt_count = payload["prompt_input_count"].to_i
      prompt_count = 3 if prompt_count <= 0

      eligible = experience.experience_participants
        .where.not(role: %w[host moderator])
        .pluck(:id)
        .map(&:to_s)
        .reject { |id| performers.include?(id) }
        .shuffle

      # Reserve a buzzer first when possible so the scene can always be ended.
      buzzer_id  = eligible.shift if eligible.length > 1
      prompt_ids = eligible.first(prompt_count)

      payload["prompt_participant_ids"] = prompt_ids
      payload["buzzer_participant_id"]  = buzzer_id
    end

    def default_sounds_for(kind)
      case kind.to_s
      when ExperienceBlock::FAMILY_FEUD
        { "on_show_x" => "buzzer_error", "theme" => "family_feud_theme" }
      when ExperienceBlock::GUESS_WHO
        {
          "on_dispatch_poll" => "buzzer_error",
          "on_conclude_poll" => "buzzer_error",
          "on_reveal"        => "buzzer_error"
        }
      when ExperienceBlock::THE_SCENE
        { "on_buzzer_press" => "buzzer_error" }
      else
        {}
      end
    end

    def guard_guess_who!(block)
      raise ArgumentError, "Block is not a Guess Who" unless block.kind == ExperienceBlock::GUESS_WHO
    end

    def create_guess_who_contestant_segment!(block)
      SegmentOrchestrator.new(
        experience: experience,
        actor: actor
      ).create_segment!(
        name: "Guess Who Contestants — Block #{block.position + 1}",
        color: "#F59E0B"
      )
    end

    def guess_who_contestant_user_ids(payload)
      contestant_segment_id = payload["contestant_segment_id"]
      return [] if contestant_segment_id.blank?

      experience.experience_participants
        .joins(:experience_segments)
        .where(experience_segments: { id: contestant_segment_id })
        .pluck(:user_id)
    end

    def guess_who_pool_user_ids(payload, contestant_user_ids)
      segment_id = payload["segment_id"]
      participants = experience.experience_participants
        .where.not(role: %w[host moderator])

      participants = if segment_id.present?
        participants.joins(:experience_segments).where(experience_segments: { id: segment_id })
      else
        participants
      end

      participants.pluck(:user_id) - Array(contestant_user_ids)
    end

    def filter_by_eligibility(user_ids, threshold)
      return user_ids if user_ids.empty?

      broadcast_block_ids = broadcast_eligible_block_ids
      return user_ids if broadcast_block_ids.empty?

      total = broadcast_block_ids.length.to_f
      participation = participation_counts_for(user_ids, broadcast_block_ids)

      user_ids.select { |uid| (participation[uid].to_i / total) >= threshold }
    end

    def broadcast_eligible_block_ids
      parent_ids = experience.experience_blocks
        .parent_blocks
        .where(visible_to_roles: [], target_user_ids: [])
        .where.missing(:experience_block_segments)
        .pluck(:id)
      return [] if parent_ids.empty?

      child_ids = ExperienceBlock.where(parent_block_id: parent_ids).pluck(:id)
      parent_ids + child_ids
    end

    def participation_counts_for(user_ids, block_ids)
      counts = Hash.new { |h, k| h[k] = Set.new }

      participant_id_to_user_id = experience.experience_participants
        .where(user_id: user_ids)
        .pluck(:id, :user_id)
        .to_h
      participant_ids = participant_id_to_user_id.keys
      return counts.transform_values(&:size) if participant_ids.empty?

      [
        ExperiencePollSubmission,
        ExperienceQuestionSubmission,
        ExperiencePhotoUploadSubmission,
        ExperienceBuzzerSubmission
      ].each do |klass|
        klass.where(experience_participant_id: participant_ids, experience_block_id: block_ids)
          .pluck(:experience_participant_id, :experience_block_id)
          .each { |pid, bid| counts[participant_id_to_user_id[pid]].add(bid) }
      end

      counts.transform_values(&:size)
    end

    def pick_two_distinct(eligible_user_ids, exclude:)
      candidates = eligible_user_ids - Array(exclude)
      shuffled = candidates.shuffle
      [shuffled[0], shuffled[1]]
    end

    def build_guess_who_contestant(contestant_user_id, mystery_user_id, board_candidate_ids)
      mystery_participant = experience.experience_participants.find_by(user_id: mystery_user_id)
      submission_entries = mystery_participant ?
        ParticipantSubmissions.new(experience).for_participant(mystery_participant.id) : []

      clues = submission_entries.map.with_index do |entry, i|
        {
          "id" => "clue-#{SecureRandom.hex(4)}",
          "prompt" => entry[:prompt],
          "answer" => entry[:answer],
          "photo_url" => entry[:photo_url],
          "source_block_id" => entry[:block_id],
          "block_kind" => entry[:block_kind],
          "position" => i,
          "hidden" => false
        }
      end

      {
        "contestant_user_id" => contestant_user_id,
        "mystery_user_id" => mystery_user_id,
        "clues" => clues,
        "current_clue_index" => 0,
        "board_candidate_ids" => board_candidate_ids - [mystery_user_id],
        "eliminated_user_ids" => [],
        "unanswered_user_ids" => []
      }
    end

    def close_balloon_pump_with_winners!(block, target_units)
      transaction do
        block.lock!
        payload = block.payload || {}
        return [] if payload["ended_at"].present?

        winning_participant_ids = ExperienceMinigameBalloonResult
          .where(experience_block_id: block.id)
          .where("fill_amount >= ?", target_units)
          .pluck(:experience_participant_id)

        winners = experience.experience_participants
          .includes(:user)
          .where(id: winning_participant_ids)
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
        .find_by(user: actor)
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
