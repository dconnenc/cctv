module Experiences
  class Orchestrator < BaseService
    def add_block!(
      kind:,
      payload: {},
      visible_to_roles: [],
      visible_to_segments: [],
      target_user_ids: [],
      status: :hidden,
      open_immediately: false,
      show_in_lobby: false
    )
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        transaction do
          max_position = experience.experience_blocks.parent_blocks.maximum(:position) || -1

          block = experience.experience_blocks.create!(
            kind: kind,
            status: status,
            payload: payload,
            visible_to_roles: visible_to_roles,
            visible_to_segments: visible_to_segments,
            target_user_ids: target_user_ids,
            position: max_position + 1
          )
          block.update!(status: :open) if open_immediately

          block
        end
      end
    end

    def close_block!(block_id)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        block = experience.experience_blocks.find(block_id)

        block.update(status: :closed)
      end
    end

    def open_block!(block_id)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        block = experience.experience_blocks.find(block_id)

        block.update(status: :open)
      end
    end

    def hide_block!(block_id)
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        block = experience.experience_blocks.find(block_id)

        block.update(status: :hidden)
      end
    end

    def open_lobby!
      actor_action do
        authorize! experience, to: :open_lobby?, with: ExperiencePolicy

        transaction do
          experience.update!(
            status: Experience.statuses[:lobby],
            join_open: true
          )
        end
      end
    end

    def start!
      actor_action do
        authorize! experience, to: :start?, with: ExperiencePolicy

        transaction do
          experience.update!(
            status: Experience.statuses[:live],
            started_at: DateTime.now,
            join_open: true
          )
        end
      end
    end

    def pause!
      actor_action do
        authorize! experience, to: :pause?, with: ExperiencePolicy
        guard_state!([:live, :lobby])

        transaction do
          experience.update!(
            status: Experience.statuses[:paused]
          )
        end
      end
    end

    def resume!
      actor_action do
        authorize! experience, to: :resume?, with: ExperiencePolicy
        guard_state!(:paused)

        transaction do
          experience.update!(
            status: Experience.statuses[:live]
          )
        end
      end
    end

    def submit_poll_response!(block_id:, answer:)
      actor_action do
        block = experience.experience_blocks.find(block_id)

        authorize! block, to: :submit_poll_response?, with: ExperienceBlockPolicy

        # Create or update the submission. Assumes single response for now
        submission = ExperiencePollSubmission.find_or_initialize_by(
          experience_block_id: block.id,
          user_id: actor.id
        )

        submission.answer = answer
        submission.save!

        submission
      end
    end

    def submit_question_response!(block_id:, answer:)
      actor_action do
        block = experience.experience_blocks.find(block_id)

        authorize! block, to: :submit_question_response?, with: ExperienceBlockPolicy

        # Create or update the submission. Assumes single response for now
        submission = ExperienceQuestionSubmission.find_or_initialize_by(
          experience_block_id: block.id,
          user_id: actor.id
        )

        submission.answer = answer
        submission.save!

        submission
      end
    end

    def submit_multistep_form_response!(block_id:, answer:)
      actor_action do
        block = experience.experience_blocks.find(block_id)

        authorize! block, to: :submit_multistep_form_response?, with: ExperienceBlockPolicy

        # Create or update the submission. Assumes single response for now
        submission = ExperienceMultistepFormSubmission.find_or_initialize_by(
          experience_block_id: block.id,
          user_id: actor.id
        )

        submission.answer = answer
        submission.save!

        submission
      end
    end

    def submit_mad_lib_response!(block_id:, answer:)
      actor_action do
        block = experience.experience_blocks.find(block_id)

        authorize! block, to: :submit_mad_lib_response?, with: ExperienceBlockPolicy

        # Create or update the submission. Assumes single response for now
        submission = ExperienceMadLibSubmission.find_or_initialize_by(
          experience_block_id: block.id,
          user_id: actor.id
        )

        submission.answer = answer
        submission.save!

        submission
      end
    end

    def add_family_feud_bucket!(block_id:, question_id:, name:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        question_block = experience.experience_blocks.find(question_id)
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

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
    end

    def rename_family_feud_bucket!(block_id:, question_id:, bucket_id:, name:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        question_block = experience.experience_blocks.find(question_id)
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

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
    end

    def delete_family_feud_bucket!(block_id:, question_id:, bucket_id:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        question_block = experience.experience_blocks.find(question_id)
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        transaction do
          question_payload = question_block.payload || {}
          buckets = question_payload["buckets"] || []
          
          question_payload["buckets"] = buckets.reject { |b| b["id"] == bucket_id }
          question_block.update!(payload: question_payload)
          
          true
        end
      end
    end

    def assign_family_feud_answer!(block_id:, question_id:, answer_id:, bucket_id:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        question_block = experience.experience_blocks.find(question_id)
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

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
    end

    def start_family_feud_playing!(block_id:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        transaction do
          current_payload = block.payload || {}
          
          # Build game state for each child question
          questions = block.child_blocks.map do |child_block|
            # Get buckets from this question's payload
            buckets = child_block.payload["buckets"] || []
            
            # Get all submissions for this question
            submissions = ExperienceQuestionSubmission.where(experience_block_id: child_block.id)
            total_answers = submissions.count
            submission_ids = submissions.pluck(:id).map(&:to_s)
            
            # Calculate percentage for each bucket based on answers from this question only
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
            
            # Sort by percentage descending
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
    end

    def reveal_family_feud_bucket!(block_id:, question_index:, bucket_index:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

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
    end

    def show_family_feud_x!(block_id:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        transaction do
          current_payload = block.payload || {}
          game_state = current_payload["game_state"] || {}
          
          game_state["show_x"] = true
          block.update!(payload: current_payload)
          
          # Schedule clearing the X flag after broadcast
          # This will be handled by controller after broadcast
          block
        end
      end
    end

    def next_family_feud_question!(block_id:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        transaction do
          current_payload = block.payload || {}
          game_state = current_payload["game_state"] || {}
          
          current_index = game_state["current_question_index"] || 0
          questions = game_state["questions"] || []
          
          if current_index >= questions.length - 1
            # Last question - close the block
            block.update!(status: :closed)
          else
            # Move to next question
            game_state["current_question_index"] = current_index + 1
            block.update!(payload: current_payload)
          end
          
          block
        end
      end
    end

    def restart_family_feud_playing!(block_id:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        transaction do
          current_payload = block.payload || {}
          game_state = current_payload["game_state"] || {}
          
          # Reset to first question and hide all buckets
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
    end

    def restart_family_feud_categorizing!(block_id:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        transaction do
          # Clear all bucket assignments from each child question
          block.clear_family_feud_bucket_assignments!
          
          # Reset to gathering phase
          current_payload = block.payload || {}
          current_payload["game_state"] = {
            "phase" => "gathering"
          }
          
          block.update!(payload: current_payload)
          block
        end
      end
    end

    def restart_family_feud_everything!(block_id:)
      actor_action do
        block = experience.experience_blocks.find(block_id)
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        transaction do
          # Delete all question submissions for all child blocks
          child_block_ids = block.child_blocks.pluck(:id)
          ExperienceQuestionSubmission.where(experience_block_id: child_block_ids).delete_all
          
          # Clear all buckets from each child question
          block.clear_all_family_feud_buckets!
          
          # Reset payload to initial state
          current_payload = block.payload || {}
          current_payload["game_state"] = { "phase" => "gathering" }
          
          block.update!(payload: current_payload)
          block
        end
      end
    end

    def add_block_with_dependencies!(
      kind:,
      payload: {},
      visible_to_roles: [],
      visible_to_segments: [],
      target_user_ids: [],
      status: :hidden,
      variables: [],
      questions: []
    )
      actor_action do
        authorize! experience, to: :manage_blocks?, with: ExperiencePolicy

        transaction do
          max_position = experience.experience_blocks.parent_blocks.maximum(:position) || -1

          parent_block = experience.experience_blocks.create!(
            kind: kind,
            status: status,
            payload: payload.except(:variables, :questions),
            visible_to_roles: visible_to_roles,
            visible_to_segments: visible_to_segments,
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
    end

    private

    def create_participant_source_block(parent_block:, variable:, participant_id:, position:)
      participant = experience.experience_participants.find_by!(user_id: participant_id)

      child_block = experience.experience_blocks.create!(
        kind: ExperienceBlock::QUESTION,
        status: parent_block.status,
        payload: {
          question: variable.label,
          formKey: variable.key,
          inputType: variable.datatype == "number" ? "number" : "text"
        },
        visible_to_roles: parent_block.visible_to_roles,
        visible_to_segments: parent_block.visible_to_segments,
        target_user_ids: [participant.user_id],
        parent_block_id: parent_block.id,
        position: position
      )

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
        visible_to_segments: parent_block.visible_to_segments,
        target_user_ids: source_spec["target_user_ids"] || [],
        parent_block_id: parent_block.id,
        position: position
      )

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
        visible_to_segments: parent_block.visible_to_segments,
        target_user_ids: [],
        parent_block_id: parent_block.id,
        position: position,
        show_in_lobby: true
      )

      ExperienceBlockLink.create!(
        parent_block: parent_block,
        child_block: child_block,
        relationship: :depends_on
      )

      child_block
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
