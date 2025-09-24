class BlockSerializer
  # Core block serialization with response data and visibility metadata
  #
  # PURPOSE:
  # Handles serialization of ExperienceBlock objects with different response data
  # based on context (user-specific vs stream-based) and role permissions.
  def self.serialize_block(block, role:, context: :user, user: nil, target_user_ids: [])
    base_structure = {
      id: block.id,
      kind: block.kind,
      status: block.status,
      payload: block.payload
    }

    response_data = case context
    when :user
      serialize_user_response_data(block, role, user)
    when :stream
      serialize_stream_response_data(block, role)
    else
      raise ArgumentError, "Invalid context: #{context}. Must be :user or :stream"
    end

    visibility_data = serialize_visibility_metadata(block, role)

    base_structure.merge(responses: response_data).merge(visibility_data)
  end

  def self.serialize_for_user(block, role:, user:)
    serialize_block(block, role: role, context: :user, user: user)
  end

  def self.serialize_for_stream(block, role:)
    serialize_block(block, role: role, context: :stream)
  end

  def self.serialize_user_response_data(block, role, user)
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
      if mod_or_host?(role) && total > 0
        response[:aggregate] = calculate_poll_aggregate(submissions)
      else
        response[:aggregate] = mod_or_host?(role) ? {} : nil
      end

      response

    when ExperienceBlock::QUESTION
      submissions = block.experience_question_submissions
      total = submissions.count
      user_response = submissions.find_by(user_id: user&.id)

      {
        total: total,
        user_response: format_user_response(user_response),
        user_responded: user_response.present?
      }

    when ExperienceBlock::MULTISTEP_FORM
      submissions = block.experience_multistep_form_submissions
      total = submissions.count
      user_response = submissions.find_by(user_id: user&.id)

      {
        total: total,
        user_response: format_user_response(user_response),
        user_responded: user_response.present?
      }

    when ExperienceBlock::ANNOUNCEMENT
      {} # Announcements don't have responses

    else
      {}
    end
  end

  def self.serialize_stream_response_data(block, role)
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
      if mod_or_host?(role) && total > 0
        response[:aggregate] = calculate_poll_aggregate(submissions)
      else
        response[:aggregate] = mod_or_host?(role) ? {} : nil
      end

      response

    when ExperienceBlock::QUESTION
      submissions = block.experience_question_submissions
      total = submissions.count

      {
        total: total,
        user_response: nil, # Stream context doesn't include individual responses
        user_responded: false
      }

    when ExperienceBlock::MULTISTEP_FORM
      submissions = block.experience_multistep_form_submissions
      total = submissions.count

      {
        total: total,
        user_response: nil, # Stream context doesn't include individual responses
        user_responded: false
      }

    when ExperienceBlock::ANNOUNCEMENT
      {} # Announcements don't have responses

    else
      {}
    end
  end

  def self.serialize_visibility_metadata(block, role)
    return {} unless mod_or_host?(role)

    {
      visible_to_roles: block.visible_to_roles,
      visible_to_segments: block.visible_to_segments
    }
  end

  def self.calculate_poll_aggregate(submissions)
    aggregate = {}
    submissions.each do |submission|
      selected_options = submission.answer["selectedOptions"] || []
      selected_options.each do |option|
        aggregate[option] ||= 0
        aggregate[option] += 1
      end
    end
    aggregate
  end

  def self.format_user_response(user_response)
    return nil unless user_response
    { id: user_response.id, answer: user_response.answer }
  end

  def self.mod_or_host?(role)
    ["moderator", "host"].include?(role.to_s)
  end
end
