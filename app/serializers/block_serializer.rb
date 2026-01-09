class BlockSerializer
  def self.serialize_block(
    block, participant_role:, context: :user, user: nil, target_user_ids: [], submissions_cache: nil, depth: 0
  )

    base_structure = {
      id: block.id,
      kind: block.kind,
      status: block.status,
      payload: block.payload
    }

    response_data = case context
    when :user
      serialize_user_response_data(block, participant_role, user, submissions_cache)
    when :stream
      serialize_stream_response_data(block, participant_role, submissions_cache)
    else
      raise ArgumentError, "Invalid context: #{context}. Must be :user or :stream"
    end

    visibility_data = serialize_visibility_metadata(block, participant_role, user)
    dag_metadata = serialize_dag_metadata(block, participant_role, user, submissions_cache, depth)

    base_structure
      .merge(responses: response_data)
      .merge(visibility_data)
      .merge(dag_metadata)
  end

  def self.serialize_for_user(block, participant_role:, user:, submissions_cache: nil, depth: 0)
    serialize_block(block, participant_role: participant_role, context: :user, user: user, submissions_cache: submissions_cache, depth: depth)
  end

  def self.serialize_for_stream(block, participant_role:, submissions_cache: nil, depth: 0)
    serialize_block(block, participant_role: participant_role, context: :stream, submissions_cache: submissions_cache, depth: depth)
  end

  def self.serialize_user_response_data(block, participant_role, user, submissions_cache = nil)
    case block.kind
    when ExperienceBlock::POLL
      submissions = if submissions_cache
        submissions_cache.dig(block.id)&.values || []
      else
        block.experience_poll_submissions
      end
      
      total = submissions.count
      user_response = if submissions_cache && user
        submissions_cache.dig(block.id, user.id)
      else
        submissions.find { |s| s.user_id == user&.id }
      end
      user_response_payload = format_user_response(user_response)

      response = {
        total: total,
        user_response: user_response_payload,
        user_responded: user_response.present?
      }

      # Add aggregate data for moderators/hosts
      if mod_or_host?(participant_role) && total > 0
        response[:aggregate] = calculate_poll_aggregate(submissions)
      else
        response[:aggregate] = mod_or_host?(participant_role) ? {} : nil
      end

      # Add all submissions for moderators/hosts/admins
      if mod_or_host?(participant_role) || user_admin?(user)
        response[:all_responses] = submissions.map do |submission|
          {
            id: submission.id,
            user_id: submission.user_id,
            answer: submission.answer,
            created_at: submission.created_at
          }
        end
      end

      response

    when ExperienceBlock::QUESTION
      submissions = if submissions_cache
        submissions_cache.dig(block.id)&.values || []
      else
        block.experience_question_submissions
      end
      
      total = submissions.count
      user_response = if submissions_cache && user
        submissions_cache.dig(block.id, user.id)
      else
        submissions.find { |s| s.user_id == user&.id }
      end

      response = {
        total: total,
        user_response: format_user_response(user_response),
        user_responded: user_response.present?
      }

      # Add all submissions for moderators/hosts/admins
      if mod_or_host?(participant_role) || user_admin?(user)
        response[:all_responses] = submissions.map do |submission|
          {
            id: submission.id,
            user_id: submission.user_id,
            answer: submission.answer,
            created_at: submission.created_at
          }
        end
      end

      response

    when ExperienceBlock::MULTISTEP_FORM
      submissions = if submissions_cache
        submissions_cache.dig(block.id)&.values || []
      else
        block.experience_multistep_form_submissions
      end
      
      total = submissions.count
      user_response = if submissions_cache && user
        submissions_cache.dig(block.id, user.id)
      else
        submissions.find { |s| s.user_id == user&.id }
      end

      response = {
        total: total,
        user_response: format_user_response(user_response),
        user_responded: user_response.present?
      }

      # Add all submissions for moderators/hosts/admins
      if mod_or_host?(participant_role) || user_admin?(user)
        response[:all_responses] = submissions.map do |submission|
          {
            id: submission.id,
            user_id: submission.user_id,
            answer: submission.answer,
            created_at: submission.created_at
          }
        end
      end

      response

    when ExperienceBlock::ANNOUNCEMENT
      {} # Announcements don't have responses

    when ExperienceBlock::MAD_LIB
      participant_record = block.experience.experience_participants.find_by(user_id: user&.id)

      resolved_variables = if participant_record
        Experiences::BlockResolver.resolve_variables(
          block: block,
          participant: participant_record,
          submissions_cache: submissions_cache
        )
      else
        {}
      end

      # Calculate aggregate responses from child blocks
      total_responses = if block.has_dependencies?
        block.children.sum do |child|
          if submissions_cache
            (submissions_cache.dig(child.id)&.values || []).count
          else
            case child.kind
            when ExperienceBlock::QUESTION
              child.experience_question_submissions.count
            when ExperienceBlock::POLL
              child.experience_poll_submissions.count
            else
              0
            end
          end
        end
      else
        0
      end

      {
        total: total_responses,
        user_response: nil,
        user_responded: false,
        resolved_variables: resolved_variables
      }

    else
      {}
    end
  end

  def self.serialize_stream_response_data(block, participant_role, submissions_cache = nil)
    case block.kind
    when ExperienceBlock::POLL
      submissions = if submissions_cache
        submissions_cache.dig(block.id)&.values || []
      else
        block.experience_poll_submissions
      end
      
      total = submissions.count

      response = {
        total: total,
        user_response: nil, # Stream context doesn't include individual responses
        user_responded: false
      }

      # Add aggregate data for moderators/hosts
      if mod_or_host?(participant_role) && total > 0
        response[:aggregate] = calculate_poll_aggregate(submissions)
      else
        response[:aggregate] = mod_or_host?(participant_role) ? {} : nil
      end

      # Add all submissions for moderators/hosts (admin stream)
      if mod_or_host?(participant_role)
        response[:all_responses] = submissions.map do |submission|
          {
            id: submission.id,
            user_id: submission.user_id,
            answer: submission.answer,
            created_at: submission.created_at
          }
        end
      end

      response

    when ExperienceBlock::QUESTION
      submissions = if submissions_cache
        submissions_cache.dig(block.id)&.values || []
      else
        block.experience_question_submissions
      end
      
      total = submissions.count

      response = {
        total: total,
        user_response: nil, # Stream context doesn't include individual responses
        user_responded: false
      }

      # Add all submissions for moderators/hosts (admin stream)
      if mod_or_host?(participant_role)
        response[:all_responses] = submissions.map do |submission|
          {
            id: submission.id,
            user_id: submission.user_id,
            answer: submission.answer,
            created_at: submission.created_at
          }
        end
      end

      response

    when ExperienceBlock::MULTISTEP_FORM
      submissions = if submissions_cache
        submissions_cache.dig(block.id)&.values || []
      else
        block.experience_multistep_form_submissions
      end
      
      total = submissions.count

      response = {
        total: total,
        user_response: nil, # Stream context doesn't include individual responses
        user_responded: false
      }

      # Add all submissions for moderators/hosts (admin stream)
      if mod_or_host?(participant_role)
        response[:all_responses] = submissions.map do |submission|
          {
            id: submission.id,
            user_id: submission.user_id,
            answer: submission.answer,
            created_at: submission.created_at
          }
        end
      end

      response

    when ExperienceBlock::ANNOUNCEMENT
      {} # Announcements don't have responses

    when ExperienceBlock::MAD_LIB
      {
        total: 0,
        user_response: nil,
        user_responded: false,
        resolved_variables: {}
      }

    else
      {}
    end
  end

  def self.serialize_visibility_metadata(block, participant_role, user)
    return {} unless mod_or_host?(participant_role) || user_admin?(user)

    {
      visible_to_roles: block.visible_to_roles,
      visible_to_segments: block.visible_to_segments,
      target_user_ids: block.target_user_ids,
      show_in_lobby: block.show_in_lobby
    }
  end

  def self.calculate_poll_aggregate(submissions)
    aggregate = {}
    submissions.each do |submission|
      selected_options = submission.answer["selectedOptions"]
      selected_options = Array(selected_options) if selected_options
      selected_options ||= []
      
      selected_options.each do |option|
        aggregate[option] ||= 0
        aggregate[option] += 1
      end
    end
    aggregate
  end

  def self.format_user_response(user_response)
    return nil unless user_response
    {
      id: user_response.id,
      answer: {
        selectedOptions: Array(user_response.answer["selectedOptions"])
      }
    }
  end

  def self.serialize_dag_metadata(block, participant_role, user, submissions_cache = nil, depth = 0)
    return {} unless mod_or_host?(participant_role) || user_admin?(user)

    # When submissions_cache is present, we know data is preloaded
    # Use map instead of pluck to avoid N+1 queries
    if submissions_cache
      # Only include IDs to avoid N+1 queries when accessing associations
      # Check if associations are loaded before accessing them
      metadata = {}
      
      if block.association(:children).loaded?
        metadata[:child_block_ids] = block.children.map(&:id)
      else
        metadata[:child_block_ids] = []
      end
      
      if block.association(:parents).loaded?
        metadata[:parent_block_ids] = block.parents.map(&:id)
      else
        metadata[:parent_block_ids] = []
      end

      # Only serialize full children for parent blocks (depth == 0) to prevent N+1
      # Child blocks don't need their children serialized recursively
      if depth == 0 && block.children.any?
        child_context = (mod_or_host?(participant_role) || user_admin?(user)) ? :user : :stream
        metadata[:children] = block.children.map do |child|
          serialize_block(child, participant_role: participant_role, context: child_context, user: user, submissions_cache: submissions_cache, depth: depth + 1)
        end
      end
    else
      # Fallback to pluck when no cache (backward compatibility)
      metadata = {
        child_block_ids: block.children.pluck(:id),
        parent_block_ids: block.parents.pluck(:id)
      }

      # Only serialize full children for parent blocks (depth == 0) to prevent N+1
      if depth == 0 && block.children.exists?
        child_context = (mod_or_host?(participant_role) || user_admin?(user)) ? :user : :stream
        metadata[:children] = block.children.map do |child|
          serialize_block(child, participant_role: participant_role, context: child_context, user: user, submissions_cache: submissions_cache, depth: depth + 1)
        end
      end
    end

    if block.kind == ExperienceBlock::MAD_LIB
      metadata[:variables] = block.variables.map do |variable|
        {
          id: variable.id,
          key: variable.key,
          label: variable.label,
          datatype: variable.datatype,
          required: variable.required
        }
      end

      metadata[:variable_bindings] = block.variables.flat_map do |variable|
        variable.bindings.map do |binding|
          {
            id: binding.id,
            variable_id: binding.variable_id,
            source_block_id: binding.source_block_id
          }
        end
      end
    end

    metadata
  end

  def self.mod_or_host?(participant_role)
    ["moderator", "host"].include?(participant_role.to_s)
  end

  def self.user_admin?(user)
    return false unless user
    ["admin", "superadmin"].include?(user.role.to_s)
  end
end
