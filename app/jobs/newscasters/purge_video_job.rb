module Newscasters
  # Deletes an uploaded source video (S3 object + ActiveStorage records) roughly
  # 24 hours after it was uploaded. Scheduled with a 24h delay at upload time.
  # The blob-age guard prevents purging a newer re-uploaded video whose own,
  # later purge is still pending.
  class PurgeVideoJob < ApplicationJob
    queue_as :default

    def perform(submission_id)
      submission = ExperienceVideoSubmission.find_by(id: submission_id)
      return unless submission&.video&.attached?
      return if submission.video.blob.created_at > 24.hours.ago

      submission.video.purge
    end
  end
end
