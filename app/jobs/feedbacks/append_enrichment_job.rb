module Feedbacks
  # Handles the narrow case where a user fills in the error prompt after the
  # Linear issue has already been created — the detail lands as a comment rather
  # than being lost.
  class AppendEnrichmentJob < ApplicationJob
    queue_as :default

    discard_on ActiveRecord::RecordNotFound

    retry_on Linear::Client::RequestFailed, wait: :polynomially_longer, attempts: 3

    def perform(feedback_id)
      feedback = Feedback.find(feedback_id)
      return if feedback.linear_issue_id.blank?
      return unless Linear::Config.enabled?

      body = [
        "**Reporter added detail**",
        feedback.title.presence && "**#{feedback.title}**",
        feedback.description.presence,
      ].compact.join("\n\n")

      return if body.blank?

      Linear::Client.new.create_comment(issue_id: feedback.linear_issue_id, body: body)
    end
  end
end
