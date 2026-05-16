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
        blocks = visible.map { |b| serialize_block(b, participant_role: role, user: participant.user, view_context: :participant) }
      else
        current = resolve_participant_block(visible)
        blocks  = current ? [serialize_block(current, participant_role: role, user: participant.user, view_context: :participant)] : []
      end

      experience_payload(blocks: blocks)
    end

    def for_profile(role:, segments:, user_id: nil)
      visible = profile_visible_blocks(role: role, segments: segments, user_id: user_id)

      if host_or_moderator?(role)
        blocks = visible.map { |b| serialize_block(b, participant_role: role, user: nil, view_context: :participant) }
      else
        current = resolve_participant_block(visible)
        blocks  = current ? [serialize_block(current, participant_role: role, user: nil, view_context: :participant)] : []
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
      @experience.experience_blocks.order(position: :asc).select(&:parent_block?)
    end

    def monitor_visible_blocks
      all     = @experience.experience_blocks.includes(:experience_segments).order(position: :asc).to_a
      parents = all.select(&:parent_block?)
      children_by_parent = all.reject { |b| b.parent_block_id.nil? }.group_by(&:parent_block_id)

      candidates = if @experience.status == "lobby"
        parents.select { |b| b.show_in_lobby? && monitor_visibility_ok?(b) }
      else
        parents.select { |b| b.open? && monitor_visibility_ok?(b) }
      end

      candidates
        .reject { |b| b.payload["show_on_monitor"] == false }
        .sort_by(&:position)
        .flat_map { |parent| resolve_monitor_entry(parent, children_by_parent[parent.id] || []) }
    end

    def monitor_visibility_ok?(block)
      return true if block.kind == ExperienceBlock::MINIGAME_ARITHMETIC
      return true if block.kind == ExperienceBlock::MINIGAME_BALLOON_PUMP
      return true if block.kind == ExperienceBlock::THE_SCENE
      !block.has_visibility_rules?
    end

    def participant_visible_blocks(participant)
      all     = @experience.experience_blocks.includes(:experience_segments).order(position: :asc).to_a
      parents = all.select(&:parent_block?)

      return parents if host_or_moderator?(participant.role)
      return parents if participant.user.admin? || participant.user.superadmin?

      parents
        .select { |b| b.visible_by_status?(@experience) }
        .select { |b| b.visible_to?(role: participant.role, segments: participant.segment_names, user_id: participant.user_id) }
    end

    def profile_visible_blocks(role:, segments:, user_id: nil)
      all     = @experience.experience_blocks.includes(:experience_segments).order(position: :asc).to_a
      parents = all.select(&:parent_block?)

      return parents if host_or_moderator?(role)

      parents
        .select { |b| b.visible_by_status?(@experience) }
        .select { |b| b.visible_to?(role: role, segments: segments, user_id: user_id) }
    end

    def resolve_participant_block(blocks)
      blocks.first
    end

    def resolve_monitor_entry(parent, children)
      sorted = children.sort_by(&:position)
      return [parent] if sorted.empty?
      return [parent] if parent.kind == ExperienceBlock::FAMILY_FEUD

      first = sorted.first
      first.has_visibility_rules? ? [parent] : [first]
    end

    def participant_block_active?
      @experience.parent_blocks
        .where(status: "open")
        .where(visible_to_roles: [], target_user_ids: [])
        .where.missing(:experience_block_segments)
        .any? { |b| b.payload["show_on_monitor"] == false }
    end

    def responded_participant_ids
      active_block_ids = @experience.parent_blocks
        .where(status: "open")
        .where(visible_to_roles: [], target_user_ids: [])
        .where.missing(:experience_block_segments)
        .pluck(:id)

      return [] if active_block_ids.empty?

      child_block_ids  = ExperienceBlock.where(parent_block_id: active_block_ids).pluck(:id)
      all_block_ids    = active_block_ids + child_block_ids

      responded_user_ids = [
        ExperiencePollSubmission,
        ExperienceQuestionSubmission,
        ExperienceMadLibSubmission
      ].flat_map { |klass| klass.where(experience_block_id: all_block_ids).distinct.pluck(:user_id) }.uniq

      @experience.experience_participants.where(user_id: responded_user_ids).pluck(:id)
    end

    # --- Block serialization ---

    def serialize_block(block, participant_role:, user: nil, depth: 0, view_context: :admin)
      {
        id:       block.id,
        kind:     block.kind,
        status:   block.status,
        payload:  shape_payload(block, participant_role, user, view_context),
        position: block.position
      }
        .merge(responses: serialize_response_data(block, participant_role, user))
        .merge(visibility_metadata(block, participant_role, user))
        .merge(dag_metadata(block, participant_role, user, depth))
    end

    def shape_payload(block, participant_role, user, view_context)
      case block.kind
      when ExperienceBlock::GUESS_WHO
        shape_guess_who_payload(block, participant_role, user, view_context)
      when ExperienceBlock::MINIGAME_ARITHMETIC
        shape_minigame_arithmetic_payload(block, participant_role, user, view_context)
      when ExperienceBlock::MINIGAME_BALLOON_PUMP
        shape_minigame_balloon_pump_payload(block, participant_role, user, view_context)
      when ExperienceBlock::THE_SCENE
        shape_the_scene_payload(block, participant_role, user, view_context)
      else
        block.payload
      end
    end

    def shape_the_scene_payload(block, participant_role, user, view_context)
      payload          = block.payload.deep_dup || {}
      phase            = payload["phase"] || "idle"
      scene_started_at = payload["scene_started_at"]
      leaderboard_size = payload["leaderboard_size"].to_i

      privileged =
        view_context == :admin ||
        (view_context == :participant && (mod_or_host?(participant_role) || admin_user?(user)))

      tally = TheScene::Tally.full(block: block, scene_started_at: scene_started_at)

      shaped = {
        "phase"            => phase,
        "scene_started_at" => scene_started_at,
        "leaderboard_size" => leaderboard_size,
        "leaderboard"      => tally.first(leaderboard_size).map { |entry| serialize_tally_entry(entry) }
      }

      if privileged
        shaped["all_suggestions"] = tally.map { |entry| serialize_tally_entry(entry) }
      end

      shaped
    end

    def serialize_tally_entry(entry)
      {
        "id"         => entry.suggestion.id,
        "text"       => entry.suggestion.text,
        "user_id"    => entry.suggestion.user_id,
        "vote_count" => entry.vote_count,
        "rank"       => entry.rank
      }
    end

    def shape_minigame_balloon_pump_payload(block, participant_role, user, view_context)
      payload = block.payload.deep_dup || {}

      privileged =
        view_context == :admin ||
        (view_context == :participant && (mod_or_host?(participant_role) || admin_user?(user)))

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

      if view_context == :participant && !privileged && user
        own = ExperienceMinigameBalloonResult.find_by(experience_block_id: block.id, user_id: user.id)
        shaped["own_fill"] = own&.fill_amount.to_i
      end

      if ended
        shaped["podium"] = balloon_pump_podium(block, shaped["winner_participant_ids"])
      end

      if privileged
        shaped["live_results"] = balloon_pump_live_results(block)
      end

      shaped
    end

    def balloon_pump_live_results(block)
      participants_by_user_id = @experience.experience_participants
        .includes(:user)
        .index_by(&:user_id)

      ExperienceMinigameBalloonResult
        .where(experience_block_id: block.id)
        .order(fill_amount: :desc)
        .map do |r|
          participant = participants_by_user_id[r.user_id]
          next nil unless participant

          {
            "participant_id" => participant.id,
            "name"           => participant.name,
            "fill_amount"    => r.fill_amount
          }
        end.compact
    end

    def balloon_pump_podium(block, winner_ids)
      participants_by_user_id = @experience.experience_participants
        .includes(:user)
        .index_by(&:user_id)
      participants_by_id = @experience.experience_participants.index_by(&:id)

      winners = winner_ids.filter_map { |id| participants_by_id[id] }

      results = ExperienceMinigameBalloonResult
        .where(experience_block_id: block.id)
        .where.not(user_id: winners.map(&:user_id))
        .order(fill_amount: :desc)
        .limit(2)
        .to_a

      runners_up = results.filter_map do |r|
        participants_by_user_id[r.user_id]
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

    def shape_guess_who_payload(block, participant_role, user, view_context)
      payload = block.payload.deep_dup || {}

      payload["user_a"] = guess_who_user_summary(payload["user_a_id"])
      payload["user_b"] = guess_who_user_summary(payload["user_b_id"])

      privileged =
        view_context == :admin ||
        (view_context == :participant && (mod_or_host?(participant_role) || admin_user?(user)))

      unless privileged
        revealed = payload["revealed"]
        payload.delete("user_a_id")
        payload.delete("user_b_id")
        unless revealed
          payload["user_a"] = nil
          payload["user_b"] = nil
        end

        payload["slides"] = Array(payload["slides"]).map do |slide|
          slide.except("user_id")
        end
      end

      payload
    end

    def shape_minigame_arithmetic_payload(block, participant_role, user, view_context)
      payload = block.payload.deep_dup || {}

      privileged =
        view_context == :admin ||
        (view_context == :participant && (mod_or_host?(participant_role) || admin_user?(user)))

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
      serialized = serialize_block(block, participant_role: "host", view_context: :monitor)

      if block.kind == ExperienceBlock::MAD_LIB
        all_resolved = @experience.experience_participants.each_with_object({}) do |participant, vars|
          vars.merge!(BlockResolver.resolve_variables(block: block, participant: participant))
        end
        serialized[:responses][:resolved_variables] = all_resolved
      end

      serialized
    end

    def serialize_response_data(block, participant_role, user)
      case block.kind
      when ExperienceBlock::POLL
        submissions = block.experience_poll_submissions.to_a
        response    = { total: submissions.count }

        if mod_or_host?(participant_role) || admin_user?(user)
          user_response = submissions.find { |s| s.user_id == user&.id }
          response[:user_response]  = format_poll_response(user_response)
          response[:user_responded] = user_response.present?
          response[:aggregate]      = submissions.any? ? calculate_poll_aggregate(submissions) : {}
          response[:all_responses]  = submissions.map { |s| submission_payload(s) }
        else
          response[:aggregate] = nil
        end

        response

      when ExperienceBlock::QUESTION
        submissions = block.experience_question_submissions.to_a
        response = { total: submissions.count }

        if mod_or_host?(participant_role) || admin_user?(user)
          user_response = submissions.find { |s| s.user_id == user&.id }
          response[:user_response]  = user_response ? { id: user_response.id, answer: user_response.answer } : nil
          response[:user_responded] = user_response.present?
          response[:all_responses]  = submissions.map { |s| submission_payload(s) }
        end

        response

      when ExperienceBlock::ANNOUNCEMENT
        {}

      when ExperienceBlock::MAD_LIB
        total    = block.has_dependencies? ? block.children.sum { |c| c.experience_question_submissions.count + c.experience_poll_submissions.count } : 0
        response = { total: total, user_response: nil, user_responded: false }

        if mod_or_host?(participant_role) || admin_user?(user)
          participant   = user && @experience.experience_participants.find_by(user_id: user.id)
          resolved_vars = participant ? BlockResolver.resolve_variables(block: block, participant: participant) : {}
          response[:resolved_variables] = resolved_vars
        end

        response

      when ExperienceBlock::PHOTO_UPLOAD
        submissions = block.experience_photo_upload_submissions.includes(photo_attachment: :blob).to_a
        response    = { total: submissions.count }

        if mod_or_host?(participant_role) || admin_user?(user)
          user_response = submissions.find { |s| s.user_id == user&.id }
          response[:user_response]  = user_response && { id: user_response.id, answer: user_response.answer, photo_url: attachment_url(user_response.photo) }
          response[:user_responded] = user_response.present?
          response[:all_responses]  = submissions.map { |s| submission_payload(s).merge(photo_url: attachment_url(s.photo)) }
        end

        response

      when ExperienceBlock::MINIGAME_ARITHMETIC
        submissions = block.experience_minigame_submissions.to_a
        response    = { total: submissions.count }

        if mod_or_host?(participant_role) || admin_user?(user)
          response[:correct_count]   = submissions.count(&:correct)
          response[:participant_counts] = submissions.group_by(&:user_id).transform_values(&:size)
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

        if mod_or_host?(participant_role) || admin_user?(user)
          user_response = submissions.find { |s| s.user_id == user&.id }
          winner        = submissions.first
          winner_avatar = winner && @experience.experience_participants.find_by(user_id: winner.user_id)&.avatar&.presence

          response[:user_response]  = user_response ? { id: user_response.id, answer: user_response.answer } : nil
          response[:user_responded] = user_response.present?
          response[:all_responses]  = submissions.map.with_index do |s, i|
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

    def visibility_metadata(block, participant_role, user)
      return {} unless mod_or_host?(participant_role) || admin_user?(user)

      {
        visible_to_roles:    block.visible_to_roles,
        visible_to_segments: block.visible_to_segment_names,
        target_user_ids:     block.target_user_ids,
        show_in_lobby:       block.show_in_lobby
      }
    end

    def dag_metadata(block, participant_role, user, depth)
      if mod_or_host?(participant_role) || admin_user?(user)
        metadata = {
          child_block_ids:  block.children.map(&:id),
          parent_block_ids: block.parents.map(&:id)
        }

        if depth == 0 && block.children.any?
          metadata[:children] = block.children.map do |child|
            serialize_block(child, participant_role: participant_role, user: user, depth: depth + 1, view_context: :admin)
          end
        end

        if block.kind == ExperienceBlock::MAD_LIB
          metadata[:variables]         = block.variables.map { |v| { id: v.id, key: v.key, label: v.label, datatype: v.datatype, required: v.required } }
          metadata[:variable_bindings] = block.variables.flat_map { |v| v.bindings.map { |b| { id: b.id, variable_id: b.variable_id, source_block_id: b.source_block_id } } }
        end

        metadata
      elsif depth == 0 && block.kind == ExperienceBlock::MAD_LIB && block.has_dependencies?
        participant = user && @experience.experience_participants.find_by(user_id: user.id)
        segments    = participant&.segment_names || []
        user_id     = participant&.user_id

        visible_children = block.children.select do |child|
          child.visible_by_status?(@experience) &&
            child.visible_to?(role: participant_role, segments: segments, user_id: user_id)
        end

        {
          children:          visible_children.map { |child| serialize_block(child, participant_role: participant_role, user: user, depth: depth + 1) },
          variables:         block.variables.map { |v| { id: v.id, key: v.key, label: v.label, datatype: v.datatype, required: v.required } },
          variable_bindings: block.variables.flat_map { |v| v.bindings.map { |b| { id: b.id, variable_id: b.variable_id, source_block_id: b.source_block_id } } }
        }
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
        playbill_enabled: @experience.playbill_enabled,
        playbill:         serialize_playbill,
        segments:         serialize_segments,
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

    def serialize_playbill
      return [] unless @experience.playbill.is_a?(Array)

      @experience.playbill.map do |section|
        resolved = section.dup
        if section["image_signed_id"].present?
          blob = ActiveStorage::Blob.find_signed(section["image_signed_id"])
          resolved["image_url"] = blob ? ActiveStorageUrlService.blob_url(blob) : nil
        end
        resolved
      end
    end

    # --- Helpers ---

    def format_poll_response(submission)
      return nil unless submission
      { id: submission.id, answer: { selectedOptions: Array(submission.answer["selectedOptions"]) } }
    end

    def calculate_poll_aggregate(submissions)
      submissions.each_with_object({}) do |s, agg|
        Array(s.answer["selectedOptions"]).each { |opt| agg[opt] = (agg[opt] || 0) + 1 }
      end
    end

    def submission_payload(submission)
      { id: submission.id, user_id: submission.user_id, answer: submission.answer, created_at: submission.created_at }
    end

    def attachment_url(attachment)
      attachment.attached? ? ActiveStorageUrlService.blob_url(attachment.blob) : nil
    end

    def host_or_moderator?(role)
      role.to_s.in?(%w[host moderator])
    end

    alias_method :mod_or_host?, :host_or_moderator?

    def admin_user?(user)
      user&.role.to_s.in?(%w[admin superadmin])
    end
  end
end
