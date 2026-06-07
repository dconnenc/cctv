module Experiences
  # Determines which blocks are visible for a given context and builds the complete
  # experience payload for each stream type (admin, monitor, participant).
  class Visibility
    def self.for_admin(experience)
      new(experience).for_admin
    end

    def self.for_monitor(experience)
      new(experience).for_monitor
    end

    def self.for_participant(experience, participant)
      new(experience).for_participant(participant)
    end

    def self.for_profile(experience, role:, segments:, user_id: nil)
      new(experience).for_profile(role: role, segments: segments, user_id: user_id)
    end

    def self.block_visible_to_user?(block:, user:)
      new(block.experience).block_visible_to_user?(block, user)
    end

    def initialize(experience)
      @experience = experience
    end

    def for_admin
      visible = admin_visible_blocks

      experience_payload(
        blocks: visible.map { |b| serialize_block(b, participant_role: "host", view_context: :admin) }
      )
    end

    def for_monitor
      visible = monitor_visible_blocks
      current = visible.first

      experience_payload(
        blocks:                    current ? [serialize_monitor_block(current)] : [],
        participant_block_active:  participant_block_active?,
        responded_participant_ids: responded_participant_ids
      )
    end

    def for_participant(participant)
      visible = participant_visible_blocks(participant)
      role    = participant.role

      if host_or_moderator?(role)
        blocks = visible.map { |b| serialize_block(b, participant_role: role, view_context: :participant) }
      else
        current = resolve_participant_block(visible)
        if current
          family = resolve_ff_family(current)
          blocks = family.map { |b| serialize_block(b, participant_role: role, view_context: :participant) }
        else
          blocks = []
        end
      end

      experience_payload(blocks: blocks)
    end

    def for_profile(role:, segments:, user_id: nil)
      visible = profile_visible_blocks(role: role, segments: segments, user_id: user_id)

      if host_or_moderator?(role)
        blocks = visible.map { |b| serialize_block(b, participant_role: role, view_context: :participant) }
      else
        current = resolve_participant_block(visible)
        if current
          family = resolve_ff_family(current)
          blocks = family.map { |b| serialize_block(b, participant_role: role, view_context: :participant) }
        else
          blocks = []
        end
      end

      experience_payload(blocks: blocks)
    end

    def block_visible_to_user?(block, user)
      return true if user.admin? || user.superadmin?

      participant = @experience.experience_participants.find_by(user_id: user.id)
      return false if participant.blank?

      if block.parent_block?
        participant_visible_blocks(participant).include?(block)
      else
        block.visible_by_status?(@experience) &&
          block.visible_to?(role: participant.role, segments: participant.segment_names, user_id: participant.user_id)
      end
    end

    private

    def admin_visible_blocks
      @experience.experience_blocks.order(position: :asc).to_a
    end

    def monitor_visible_blocks
      all      = @experience.experience_blocks.includes(:experience_segments).order(position: :asc).to_a
      parents  = all.select(&:parent_block?)
      children = all.reject(&:parent_block?)
      children_by_parent = children.group_by(&:parent_block_id)

      open_parent_ids = parents.select(&:open?).map(&:id).to_set

      if @experience.status == "lobby"
        parent_candidates = parents.select(&:show_in_lobby?)
        child_candidates  = children.select { |c| c.show_in_lobby? && !open_parent_ids.include?(c.parent_block_id) }
      else
        parent_candidates = parents.select(&:open?)
        child_candidates  = children.select { |c| c.open? && !open_parent_ids.include?(c.parent_block_id) }
      end

      parent_entries = parent_candidates
        .reject { |b| b.payload["show_on_monitor"] == false }
        .sort_by(&:position)
        .flat_map { |parent| resolve_monitor_entry(parent, children_by_parent[parent.id] || []) }

      orphan_entries = child_candidates
        .reject { |b| b.payload["show_on_monitor"] == false }
        .sort_by { |c| [parent_position_for(c, parents), c.position] }

      parent_entries + orphan_entries
    end

    def parent_position_for(child, parents)
      parent = parents.find { |p| p.id == child.parent_block_id }
      parent&.position || Float::INFINITY
    end

    def participant_visible_blocks(participant)
      all     = @experience.experience_blocks.includes(:experience_segments).order(position: :asc).to_a
      parents = all.select(&:parent_block?)

      return parents if host_or_moderator?(participant.role)

      participant_facing_blocks(
        parents: parents,
        children: all.reject(&:parent_block?),
        role: participant.role,
        segments: participant.segment_names,
        user_id: participant.user_id
      )
    end

    def profile_visible_blocks(role:, segments:, user_id: nil)
      all     = @experience.experience_blocks.includes(:experience_segments).order(position: :asc).to_a
      parents = all.select(&:parent_block?)

      return parents if host_or_moderator?(role)

      participant_facing_blocks(
        parents: parents,
        children: all.reject(&:parent_block?),
        role: role,
        segments: segments,
        user_id: user_id
      )
    end

    def participant_facing_blocks(parents:, children:, role:, segments:, user_id:)
      # FAMILY_FEUD blocks in gathering phase are transparent to participants:
      # their child question blocks surface as orphans so participants can answer them.
      # Once playing starts, FF becomes a normal open parent and gates its children.
      gathering_ff_ids = parents
        .select { |b| b.kind == ExperienceBlock::FAMILY_FEUD && family_feud_gathering?(b) }
        .map(&:id).to_set

      visible_parents = parents
        .reject { |b| gathering_ff_ids.include?(b.id) }
        .select { |b| b.visible_by_status?(@experience) }
        .select { |b| b.visible_to?(role: role, segments: segments, user_id: user_id) }

      open_parent_ids = parents
        .reject { |b| gathering_ff_ids.include?(b.id) }
        .select(&:open?).map(&:id).to_set

      visible_orphan_children = children
        .reject { |c| open_parent_ids.include?(c.parent_block_id) }
        .select { |c| c.visible_by_status?(@experience) }
        .select { |c| c.visible_to?(role: role, segments: segments, user_id: user_id) }

      visible_parents + visible_orphan_children
    end

    def family_feud_gathering?(block)
      game_state = block.payload&.dig("game_state")
      game_state.nil? || game_state["phase"] == "gathering"
    end

    def resolve_participant_block(blocks)
      blocks.first
    end

    def resolve_ff_family(block)
      if block.kind == ExperienceBlock::FAMILY_FEUD && family_feud_gathering?(block)
        [block] + block.child_blocks.order(position: :asc).to_a
      elsif block.parent_block_id.present?
        parent = block.parent_block
        if parent&.kind == ExperienceBlock::FAMILY_FEUD
          [parent] + parent.child_blocks.order(position: :asc).to_a
        else
          [block]
        end
      else
        [block]
      end
    end

    def resolve_monitor_entry(parent, children)
      sorted = children.sort_by(&:position)
      return [parent] if sorted.empty?
      return [parent] if parent.kind == ExperienceBlock::FAMILY_FEUD
      return [parent] if parent.kind == ExperienceBlock::GUESS_WHO

      first = sorted.first
      first.has_visibility_rules? ? [parent] : [first]
    end

    def participant_block_active?
      @experience.experience_blocks
        .where(status: "open")
        .where(visible_to_roles: [], target_user_ids: [])
        .where.missing(:experience_block_segments)
        .any? { |b| b.payload["show_on_monitor"] == false }
    end

    def responded_participant_ids
      active_block_ids = @experience.experience_blocks
        .where(status: "open")
        .where(visible_to_roles: [], target_user_ids: [])
        .where.missing(:experience_block_segments)
        .pluck(:id)

      return [] if active_block_ids.empty?

      child_block_ids  = ExperienceBlock.where(parent_block_id: active_block_ids).pluck(:id)
      all_block_ids    = (active_block_ids + child_block_ids).uniq

      [
        ExperiencePollSubmission,
        ExperienceQuestionSubmission
      ].flat_map { |klass| klass.where(experience_block_id: all_block_ids).distinct.pluck(:experience_participant_id) }.uniq
    end

    # --- Block serialization ---

    def serialize_block(block, participant_role:, depth: 0, view_context: :admin)
      {
        id:                  block.id,
        kind:                block.kind,
        status:              block.status,
        parent_block_id:     block.parent_block_id,
        payload:             shape_payload(block, participant_role, view_context),
        sounds:              block.sounds,
        position:            block.position,
        add_to_playbill:     block.add_to_playbill,
        playbill_mysterious: block.playbill_mysterious
      }
        .merge(responses: serialize_response_data(block, participant_role))
        .merge(visibility_metadata(block, participant_role))
        .merge(dag_metadata(block, participant_role, depth))
    end

    def shape_payload(block, participant_role, view_context)
      case block.kind
      when ExperienceBlock::GUESS_WHO
        shape_guess_who_payload(block, participant_role, view_context)
      when ExperienceBlock::MINIGAME_ARITHMETIC
        shape_minigame_arithmetic_payload(block, participant_role, view_context)
      when ExperienceBlock::MINIGAME_BALLOON_PUMP
        shape_minigame_balloon_pump_payload(block, participant_role, view_context)
      when ExperienceBlock::THE_SCENE
        shape_the_scene_payload(block, participant_role, view_context)
      else
        block.payload
      end
    end


    def shape_the_scene_payload(block, participant_role, view_context)
      payload          = block.payload.deep_dup || {}
      phase            = legacy_the_scene_phase(payload["phase"])
      scene_started_at = payload["scene_started_at"]
      leaderboard_size = payload["leaderboard_size"].to_i

      privileged =
        view_context == :admin ||
        (view_context == :participant && mod_or_host?(participant_role))

      tally = TheScene::Tally.full(block: block, scene_started_at: scene_started_at)

      performer_ids = Array(payload["performer_participant_ids"]).map(&:to_s)
      prompt_ids    = Array(payload["prompt_participant_ids"]).map(&:to_s)
      buzzer_id     = payload["buzzer_participant_id"]

      shaped = {
        "phase"                     => phase,
        "scene_started_at"          => scene_started_at,
        "winner_revealed_at"        => payload["winner_revealed_at"],
        "leaderboard_size"          => leaderboard_size,
        "prompt_input_count"        => (payload["prompt_input_count"] || 3).to_i,
        "performer_participant_ids" => performer_ids,
        "prompt_participant_ids"    => prompt_ids,
        "buzzer_participant_id"     => buzzer_id,
        "leaderboard"               => tally.first(leaderboard_size).map { |entry| serialize_tally_entry(entry) },
        "performers"                => the_scene_performer_summaries(performer_ids)
      }

      if privileged
        shaped["all_suggestions"] = tally.map { |entry| serialize_tally_entry(entry) }
      end

      shaped
    end

    def legacy_the_scene_phase(phase)
      case phase.to_s
      when "voting" then "collecting"
      when "", nil  then "idle"
      else phase.to_s
      end
    end

    def the_scene_performer_summaries(performer_participant_ids)
      return [] if performer_participant_ids.empty?

      participants = @experience.experience_participants
        .includes(:user)
        .where(id: performer_participant_ids)
        .to_a

      user_ids = participants.map(&:user_id)
      performers_by_user_id = Performer.where(user_id: user_ids).index_by(&:user_id)

      participants.map do |p|
        performer = performers_by_user_id[p.user_id]
        {
          "participant_id" => p.id,
          "user_id"        => p.user_id,
          "name"           => performer&.name.presence || p.name,
          "slug"           => performer&.slug,
          "photo_url"      => performer&.photo_url,
          "has_performer_profile" => performer.present?
        }
      end
    end

    def serialize_tally_entry(entry)
      {
        "id"             => entry.suggestion.id,
        "text"           => entry.suggestion.text,
        "participant_id" => entry.suggestion.experience_participant_id,
        "vote_count"     => entry.vote_count,
        "rank"           => entry.rank
      }
    end

    def shape_minigame_balloon_pump_payload(block, participant_role, view_context)
      payload = block.payload.deep_dup || {}

      privileged =
        view_context == :admin ||
        (view_context == :participant && mod_or_host?(participant_role))

      target_units = payload["target_units"].to_i
      ended        = payload["ended_at"].present?

      shaped = {
        "variant"                => payload["variant"],
        "target_units"           => target_units,
        "started_at"             => payload["started_at"],
        "ended_at"               => payload["ended_at"],
        "leader_fill"            => payload["leader_fill"].to_i,
        "leader_participant_id"  => payload["leader_participant_id"],
        "winner_participant_ids" => Array(payload["winner_participant_ids"])
      }

      if ended
        shaped["podium"] = balloon_pump_podium(block, shaped["winner_participant_ids"])
      end

      if privileged
        shaped["live_results"] = balloon_pump_live_results(block)
      end

      shaped
    end


    def balloon_pump_live_results(block)
      participants_by_id = @experience.experience_participants
        .includes(:user)
        .index_by(&:id)

      ExperienceMinigameBalloonResult
        .where(experience_block_id: block.id)
        .order(fill_amount: :desc)
        .map do |r|
          participant = participants_by_id[r.experience_participant_id]
          next nil unless participant

          {
            "participant_id" => participant.id,
            "name"           => participant.name,
            "fill_amount"    => r.fill_amount
          }
        end.compact
    end

    def balloon_pump_podium(block, winner_ids)
      participants_by_id = @experience.experience_participants
        .includes(:user)
        .index_by(&:id)

      winners = winner_ids.filter_map { |id| participants_by_id[id] }

      results = ExperienceMinigameBalloonResult
        .where(experience_block_id: block.id)
        .where.not(experience_participant_id: winners.map(&:id))
        .order(fill_amount: :desc)
        .limit(2)
        .to_a

      runners_up = results.filter_map do |r|
        participants_by_id[r.experience_participant_id]
      end

      podium_for = ->(participant, place, fill) do
        next nil unless participant
        {
          "place"          => place,
          "participant_id" => participant.id,
          "name"           => participant.name,
          "avatar"         => participant.avatar.presence,
          "fill_amount"    => fill
        }
      end

      target_units = block.payload["target_units"].to_i

      gold = winners.map { |p| podium_for.call(p, 1, target_units) }
      silver = runners_up[0] && [podium_for.call(runners_up[0], 2, results[0]&.fill_amount.to_i)]
      bronze = runners_up[1] && [podium_for.call(runners_up[1], 3, results[1]&.fill_amount.to_i)]

      [gold, silver, bronze].compact.flatten.compact
    end

    def shape_guess_who_payload(block, participant_role, view_context)
      payload = block.payload.deep_dup || {}
      contestants = Array(payload["contestants"])

      privileged =
        view_context == :admin ||
        view_context == :monitor ||
        (view_context == :participant && mod_or_host?(participant_role))

      payload["contestants"] = contestants.map do |c|
        shaped = {
          "contestant_user_id" => c["contestant_user_id"],
          "contestant" => guess_who_user_summary(c["contestant_user_id"]),
          "board_candidate_ids" => Array(c["board_candidate_ids"]),
          "eliminated_user_ids" => Array(c["eliminated_user_ids"]),
          "unanswered_user_ids" => Array(c["unanswered_user_ids"]),
          "current_clue_index" => c["current_clue_index"].to_i
        }

        if privileged
          revealed_or_priv = payload["revealed"] || view_context != :monitor
          shaped["mystery_user_id"] = revealed_or_priv ? c["mystery_user_id"] : nil
          shaped["mystery"] = revealed_or_priv ? guess_who_user_summary(c["mystery_user_id"]) : nil
          shaped["clues"] = Array(c["clues"])
        else
          shaped["mystery_user_id"] = payload["revealed"] ? c["mystery_user_id"] : nil
          shaped["mystery"] = payload["revealed"] ? guess_who_user_summary(c["mystery_user_id"]) : nil
          shaped["clues"] = []
        end

        shaped
      end

      payload["active_poll_response_count"] = guess_who_active_poll_response_count(payload)
      payload["active_poll_total_participants"] = guess_who_active_poll_total(payload)
      payload["active_poll"] = guess_who_active_poll_for(payload) if payload["active_poll_block_id"].present?

      payload
    end

    def guess_who_active_poll_for(payload)
      poll_block = @experience.experience_blocks.find_by(id: payload["active_poll_block_id"])
      return nil unless poll_block

      {
        "id" => poll_block.id,
        "options" => Array(poll_block.payload["options"])
      }
    end

    def guess_who_active_poll_response_count(payload)
      poll_id = payload["active_poll_block_id"]
      return 0 if poll_id.blank?

      ExperiencePollSubmission.where(experience_block_id: poll_id).count
    end

    def guess_who_active_poll_total(payload)
      poll_id = payload["active_poll_block_id"]
      return 0 if poll_id.blank?

      @experience.experience_participants
        .where.not(role: %w[host moderator])
        .count
    end

    def shape_minigame_arithmetic_payload(block, participant_role, view_context)
      payload = block.payload.deep_dup || {}

      privileged =
        view_context == :admin ||
        (view_context == :participant && mod_or_host?(participant_role))

      ended  = payload["ended_at"].present?
      started = payload["started_at"].present?

      shaped = {
        "variant"          => payload["variant"],
        "duration_seconds" => payload["duration_seconds"],
        "question_count"   => payload["question_count"],
        "leaderboard_size" => payload["leaderboard_size"],
        "started_at"       => payload["started_at"],
        "ended_at"         => payload["ended_at"]
      }

      if privileged
        shaped["questions"] = payload["questions"]
      end

      if ended
        size = payload["leaderboard_size"].to_i
        full = Minigames::ArithmeticLeaderboard.compute(block: block)
        shaped["leaderboard"] = leaderboard_top_n(full, size)
      end

      if view_context == :monitor
        shaped["submission_count"] = ExperienceMinigameSubmission.where(experience_block_id: block.id).count
      end

      shaped
    end

    def leaderboard_top_n(entries, size)
      return entries if size <= 0 || entries.empty?

      cutoff = entries[size - 1]
      return entries if cutoff.nil?

      entries.select { |e| e["correct"] >= cutoff["correct"] }
    end

    def guess_who_user_summary(user_id)
      return nil if user_id.blank?

      participant = @experience.experience_participants.includes(:user).find_by(user_id: user_id)
      return nil unless participant

      {
        "user_id" => participant.user_id,
        "name" => participant.name,
        "avatar" => participant.avatar.presence
      }
    end

    def serialize_monitor_block(block)
      serialize_block(block, participant_role: "host", view_context: :monitor)
    end

    def serialize_response_data(block, participant_role)
      case block.kind
      when ExperienceBlock::POLL
        submissions = block.experience_poll_submissions.to_a
        response    = { total: submissions.count }

        if mod_or_host?(participant_role)
          response[:aggregate]     = submissions.any? ? calculate_poll_aggregate(submissions) : {}
          response[:all_responses] = submissions.map { |s| submission_payload(s) }
        end

        response

      when ExperienceBlock::QUESTION
        submissions = block.experience_question_submissions.to_a
        response    = { total: submissions.count }

        if mod_or_host?(participant_role)
          response[:all_responses] = submissions.map { |s| submission_payload(s) }
        end

        response

      when ExperienceBlock::ANNOUNCEMENT
        {}

      when ExperienceBlock::PHOTO_UPLOAD
        submissions = block.experience_photo_upload_submissions.includes(photo_attachment: :blob).to_a
        response    = { total: submissions.count }

        if mod_or_host?(participant_role)
          response[:all_responses] = submissions.map { |s| submission_payload(s).merge(photo_url: attachment_url(s.photo)) }
        end

        response

      when ExperienceBlock::MINIGAME_ARITHMETIC
        submissions = block.experience_minigame_submissions.to_a
        response    = { total: submissions.count }

        if mod_or_host?(participant_role)
          response[:correct_count]      = submissions.count(&:correct)
          response[:participant_counts] = submissions.group_by(&:experience_participant_id).transform_values(&:size)
        end

        response

      when ExperienceBlock::MINIGAME_BALLOON_PUMP
        results = block.experience_minigame_balloon_results.to_a
        { total: results.count }

      when ExperienceBlock::THE_SCENE
        suggestion_count = block.improv_suggestions.active.count
        vote_count =
          if block.payload["scene_started_at"].present?
            block.improv_votes.where(scene_started_at: block.payload["scene_started_at"]).count
          else
            0
          end
        { total: suggestion_count, vote_count: vote_count }

      when ExperienceBlock::BUZZER
        submissions = block.experience_buzzer_submissions.order(Arel.sql("answer->>'buzzed_at' ASC")).to_a
        response    = { total: submissions.count }

        if mod_or_host?(participant_role)
          winner        = submissions.first
          winner_avatar = winner && @experience.experience_participants.find_by(id: winner.experience_participant_id)&.avatar&.presence

          response[:all_responses] = submissions.map.with_index do |s, i|
            entry = submission_payload(s)
            entry[:avatar] = winner_avatar if i == 0 && winner_avatar
            entry
          end
        end

        response

      else
        {}
      end
    end

    def visibility_metadata(block, participant_role)
      return {} unless mod_or_host?(participant_role)
      {
        visible_to_roles:    block.visible_to_roles,
        visible_to_segments: block.visible_to_segment_names,
        target_user_ids:     block.target_user_ids,
        show_in_lobby:       block.show_in_lobby
      }
    end

    def dag_metadata(block, participant_role, depth)
      if mod_or_host?(participant_role)
        metadata = {
          child_block_ids:  block.children.map(&:id),
          parent_block_ids: block.parents.map(&:id)
        }

        if depth == 0 && block.children.any?
          metadata[:children] = block.children.map do |child|
            serialize_block(child, participant_role: participant_role, depth: depth + 1, view_context: :admin)
          end
        end

        metadata
      else
        {}
      end
    end

    # --- Experience serialization ---

    def experience_payload(blocks:, **extra)
      base_url     = Rails.application.config.app_base_url
      participants = @experience.experience_participants.includes(:user).to_a

      result = {
        id:               @experience.id,
        name:             @experience.name,
        code:             @experience.code,
        code_slug:        @experience.code_slug,
        url:              "#{base_url}/experiences/#{@experience.code_slug}",
        status:           @experience.status,
        description:      @experience.description,
        creator_id:       @experience.creator_id,
        created_at:       @experience.created_at,
        updated_at:       @experience.updated_at,
        blocks:           blocks,
        playbill_enabled:        @experience.playbill_enabled,
        playbill:                serialize_playbill,
        playbill_running_order:  serialize_playbill_running_order,
        segments:                serialize_segments,
        default_segment_id: @experience.default_segment_id,
        hosts:            serialize_participants(participants.select { |p| p.role == "host" }),
        participants:     serialize_participants(participants)
      }

      result.merge(extra)
    end

    def serialize_participants(participants)
      participants.map do |p|
        {
          id:            p.id,
          user_id:       p.user.id,
          experience_id: p.experience_id,
          name:          p.name,
          email:         p.user.email,
          status:        p.status,
          role:          p.role,
          segments:      p.segment_names,
          joined_at:     p.joined_at,
          fingerprint:   p.fingerprint,
          created_at:    p.created_at,
          updated_at:    p.updated_at
        }
      end
    end

    def serialize_segments
      @experience.experience_segments.order(position: :asc).map do |s|
        { id: s.id, name: s.name, color: s.color, position: s.position }
      end
    end

    def serialize_playbill_running_order
      @experience.experience_blocks
        .where(parent_block_id: nil, add_to_playbill: true)
        .order(position: :asc)
        .map do |block|
          {
            id:                  block.id,
            kind:                block.kind,
            position:            block.position,
            playbill_mysterious: block.playbill_mysterious,
            title:               block.playbill_mysterious ? nil : derive_playbill_title(block)
          }
        end
    end

    def derive_playbill_title(block)
      payload = block.payload || {}

      case block.kind
      when ExperienceBlock::POLL, ExperienceBlock::QUESTION
        payload["question"].to_s.strip.presence
      when ExperienceBlock::ANNOUNCEMENT
        msg = payload["message"].to_s.strip
        if msg.empty?
          nil
        else
          msg.length > 60 ? "#{msg[0, 60]}…" : msg
        end
      when ExperienceBlock::FAMILY_FEUD
        payload["title"].to_s.strip.presence
      when ExperienceBlock::PHOTO_UPLOAD
        payload["prompt"].to_s.strip.presence
      when ExperienceBlock::BUZZER
        payload["label"].to_s.strip.presence || payload["prompt"].to_s.strip.presence
      end
    end

    def serialize_playbill
      return [] unless @experience.playbill.is_a?(Array)

      @experience.playbill.map do |section|
        resolved = section.dup
        if section["image_signed_id"].present?
          blob = ActiveStorage::Blob.find_signed(section["image_signed_id"])
          if blob
            resolved["image_url"] = ActiveStorageUrlService.blob_url(blob)
            blob.analyze unless blob.analyzed?
            width = blob.metadata["width"]
            height = blob.metadata["height"]
            resolved["image_width"] = width if width.is_a?(Integer) && width.positive?
            resolved["image_height"] = height if height.is_a?(Integer) && height.positive?
          else
            resolved["image_url"] = nil
          end
        end
        resolved
      end
    end

    # --- Helpers ---

    def calculate_poll_aggregate(submissions)
      submissions.each_with_object({}) do |s, agg|
        Array(s.answer["selectedOptions"]).each { |opt| agg[opt] = (agg[opt] || 0) + 1 }
      end
    end

    def submission_payload(submission)
      {
        id: submission.id,
        experience_participant_id: submission.experience_participant_id,
        answer: submission.answer,
        created_at: submission.created_at
      }
    end

    def attachment_url(attachment)
      attachment.attached? ? ActiveStorageUrlService.blob_url(attachment.blob) : nil
    end

    def host_or_moderator?(role)
      role.to_s.in?(%w[host moderator])
    end
    alias_method :mod_or_host?, :host_or_moderator?
  end
end
