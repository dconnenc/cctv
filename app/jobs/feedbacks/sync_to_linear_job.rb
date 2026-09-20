module Feedbacks
  # Pushes a Feedback to Linear out of band so a slow or down Linear never
  # affects the submitting participant. The Feedback row is authoritative; the
  # issue is a projection that can be retried until it lands.
  class SyncToLinearJob < ApplicationJob
    queue_as :default

    discard_on ActiveRecord::RecordNotFound

    # Feedback that can roll up into a shared issue locks on its group key so two
    # concurrent submissions cannot each decide they are the first and open
    # duplicate issues. Unrelated feedback locks on its own id and never waits.
    sidekiq_options lock: :while_executing,
                    lock_args_method: :lock_args,
                    on_conflict: { server: :reschedule }

    def self.lock_args(args)
      [args.second]
    end

    retry_on Linear::Client::RequestFailed,
      wait: :polynomially_longer,
      attempts: 5 do |job, error|
        feedback = Feedback.find_by(id: job.arguments.first)
        feedback&.update_columns(
          sync_status: "failed",
          sync_error: error.message.to_s.truncate(1_000),
          updated_at: Time.current,
        )
      end

    def perform(feedback_id, _group_key = nil)
      feedback = Feedback.find(feedback_id)
      return unless feedback.sync_pending?

      unless Linear::Config.enabled?
        feedback.update!(sync_status: :skipped)
        return
      end

      client = Linear::Client.new
      parent = feedback.rollup_parent

      if parent&.linear_issue_id.present?
        add_to_existing_issue(client, feedback, parent)
      else
        open_new_issue(client, feedback)
      end
    end

    private

    def add_to_existing_issue(client, feedback, parent)
      builder = IssueBuilder.new(feedback, asset_urls: upload_attachments(client, feedback))
      client.create_comment(issue_id: parent.linear_issue_id, body: builder.comment)

      Feedback.transaction do
        parent.increment!(:occurrence_count)
        feedback.update!(
          linear_parent_feedback: parent,
          linear_issue_id: parent.linear_issue_id,
          linear_issue_identifier: parent.linear_issue_identifier,
          linear_issue_url: parent.linear_issue_url,
          linear_synced_at: Time.current,
          sync_status: :synced,
          sync_error: nil,
        )
      end
    end

    def open_new_issue(client, feedback)
      builder = IssueBuilder.new(feedback, asset_urls: upload_attachments(client, feedback))
      team_id = client.team_id(Linear::Config.team_key)
      label_ids = builder.labels.map { |name| client.label_id(team_id, name) }

      issue = client.create_issue(
        team_id: team_id,
        title: builder.title,
        description: builder.description,
        label_ids: label_ids,
        project_id: Linear::Config.project_id,
      )

      feedback.update!(
        linear_issue_id: issue["id"],
        linear_issue_identifier: issue["identifier"],
        linear_issue_url: issue["url"],
        linear_synced_at: Time.current,
        sync_status: :synced,
        sync_error: nil,
      )
    end

    # Screenshots and clips are re-hosted inside Linear so triage never depends
    # on our storage staying reachable or on a signed URL that expires.
    def upload_attachments(client, feedback)
      return [] unless feedback.attachments.attached?

      feedback.attachments.map do |attachment|
        blob = attachment.blob

        url = blob.open do |file|
          client.upload_file(
            filename: blob.filename.to_s,
            content_type: blob.content_type,
            io: file,
            byte_size: blob.byte_size,
          )
        end

        { filename: blob.filename.to_s, content_type: blob.content_type, url: url }
      end
    end
  end
end
