class BlockSerializer
  def self.serialize_block(
    block, participant_role:, context: :user, user: nil, target_user_ids: []
  )

    base_structure = {
      id: block.id,
      kind: block.kind,
      status: block.status,
      payload: block.payload
    }

    response_data = case context
    when :user
      serialize_user_response_data(block, participant_role, user)
    when :stream
      serialize_stream_response_data(block, participant_role)
    else
      raise ArgumentError, "Invalid context: #{context}. Must be :user or :stream"
    end

    visibility_data = serialize_visibility_metadata(block, participant_role, user)
    dag_metadata = serialize_dag_metadata(block, participant_role, user)

    base_structure
      .merge(responses: response_data)
      .merge(visibility_data)
      .merge(dag_metadata)
  end

  def self.serialize_for_user(block, participant_role:, user:)
    serialize_block(block, participant_role: participant_role, context: :user, user: user)
  end

  def self.serialize_for_stream(block, participant_role:)
    serialize_block(block, participant_role: participant_role, context: :stream)
  end

  def self.serialize_user_response_data(block, participant_role, user)
    case block.kind
    when ExperienceBlock::POLL
      submissions = block.experience_poll_submissions
      total = submissions.count
      user_response = submissions.find_by(user_id: user&.id)
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
      submissions = block.experience_question_submissions
      total = submissions.count
      user_response = submissions.find_by(user_id: user&.id)

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
      submissions = block.experience_multistep_form_submissions
      total = submissions.count
      user_response = submissions.find_by(user_id: user&.id)

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
          participant: participant_record
        )
      else
        {}
      end

      # Calculate aggregate responses from child blocks
      total_responses = if block.has_dependencies?
        block.children.sum do |child|
          case child.kind
          when ExperienceBlock::QUESTION
            child.experience_question_submissions.count
          when ExperienceBlock::POLL
            child.experience_poll_submissions.count
          else
            0
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

    when ExperienceBlock::PHOTO_UPLOAD
      submissions = block.experience_photo_upload_submissions.includes(photo_attachment: :blob)
      total = submissions.count
      user_response = submissions.find { |s| s.user_id == user&.id }

      response = {
        total: total,
        user_response: if user_response
          {
            id: user_response.id,
            answer: user_response.answer,
            photo_url: user_response.photo.attached? ? ActiveStorageUrlService.blob_url(user_response.photo.blob) : nil
          }
        end,
        user_responded: user_response.present?
      }

      if mod_or_host?(participant_role) || user_admin?(user)
        response[:all_responses] = submissions.map do |submission|
          {
            id: submission.id,
            user_id: submission.user_id,
            answer: submission.answer,
            photo_url: submission.photo.attached? ? ActiveStorageUrlService.blob_url(submission.photo.blob) : nil,
            created_at: submission.created_at
          }
        end
      end

      response

    else
      {}
    end
  end

  def self.serialize_stream_response_data(block, participant_role)
    case block.kind
    when ExperienceBlock::POLL
      submissions = block.experience_poll_submissions
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
      submissions = block.experience_question_submissions
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
      submissions = block.experience_multistep_form_submissions
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

    when ExperienceBlock::PHOTO_UPLOAD
      submissions = block.experience_photo_upload_submissions.includes(photo_attachment: :blob)
      total = submissions.count

      response = {
        total: total,
        user_response: nil,
        user_responded: false
      }

      if mod_or_host?(participant_role)
        response[:all_responses] = submissions.map do |submission|
          {
            id: submission.id,
            user_id: submission.user_id,
            answer: submission.answer,
            photo_url: submission.photo.attached? ? ActiveStorageUrlService.blob_url(submission.photo.blob) : nil,
            created_at: submission.created_at
          }
        end
      end

      response

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

  def self.serialize_dag_metadata(block, participant_role, user)
    return {} unless mod_or_host?(participant_role) || user_admin?(user)

    metadata = {
      child_block_ids: block.children.pluck(:id),
      parent_block_ids: block.parents.pluck(:id)
    }

    # Include full child block data for moderators/hosts
    if block.children.any?
      # Use :user context for moderators/hosts to include all_responses
      child_context = (mod_or_host?(participant_role) || user_admin?(user)) ? :user : :stream
      metadata[:children] = block.children.map do |child|
        serialize_block(child, participant_role: participant_role, context: child_context, user: user)
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
