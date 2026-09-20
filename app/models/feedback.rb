class Feedback < ApplicationRecord
  # Repeat occurrences of the same client error roll up into the first feedback
  # carrying that fingerprint, so one bad render loop during a show produces one
  # Linear issue with a comment trail rather than hundreds of issues.
  ERROR_DEDUPE_WINDOW = 24.hours

  MAX_CONSOLE_LOGS = 100
  MAX_ATTACHMENTS = 5
  MAX_ATTACHMENT_BYTES = 50.megabytes
  ATTACHMENT_CONTENT_TYPES = %w[
    image/png image/jpeg image/gif image/webp image/heic
    video/mp4 video/quicktime video/webm
  ].freeze

  TYPES = [
    BUG = "bug",
    EXPERIENCE = "experience",
    GENERAL = "general",
    OTHER = "other"
  ].freeze

  # Offered by default on a feedback block: what a host actually wants from a
  # room at the end of a show, minus the catch-all.
  DEFAULT_BLOCK_TYPES = ["experience", "bug", "general"].freeze

  SOURCES = [
    MANUAL = "manual",
    ERROR = "error",
    BLOCK = "block"
  ].freeze

  belongs_to :user, optional: true
  belongs_to :experience, optional: true
  belongs_to :experience_participant, optional: true
  belongs_to :experience_block, optional: true

  belongs_to :linear_parent_feedback, class_name: "Feedback", optional: true
  has_many :linear_child_feedbacks,
    class_name: "Feedback",
    foreign_key: :linear_parent_feedback_id,
    dependent: :nullify

  has_many_attached :attachments

  enum :feedback_type, TYPES.index_by(&:itself), prefix: :type
  enum :source, SOURCES.index_by(&:itself), prefix: :source
  enum :sync_status, {
    pending: "pending",
    synced: "synced",
    failed: "failed",
    skipped: "skipped"
  }, prefix: :sync

  validates :title, length: { maximum: 200 }, allow_nil: true
  validates :description, length: { maximum: 10_000 }, allow_nil: true
  validates :description, presence: true, unless: :source_error?
  validate :attachments_within_limits

  scope :roots, -> { where(linear_parent_feedback_id: nil) }
  scope :awaiting_sync, -> { where(sync_status: :pending) }

  # Resolves the feedback whose Linear issue this one should roll into, or nil
  # when it warrants its own issue. Errors group by fingerprint within the dedupe
  # window; non-bug block submissions group per block so a 50-person audience
  # produces one digest issue. Everything else stands alone.
  def rollup_parent
    case source
    when ERROR
      return nil if error_fingerprint.blank?

      self.class
        .roots
        .where(source: ERROR, error_fingerprint: error_fingerprint)
        .where.not(id: id)
        .where(created_at: ERROR_DEDUPE_WINDOW.ago..)
        .order(:created_at)
        .first
    when BLOCK
      return nil if type_bug? || experience_block_id.blank?

      self.class
        .roots
        .where(source: BLOCK, experience_block_id: experience_block_id)
        .where.not(id: id)
        .where.not(feedback_type: BUG)
        .order(:created_at)
        .first
    end
  end

  # Serializes concurrent Linear syncs that may target the same issue. Feedback
  # that can never roll up locks on its own id so it never contends.
  def linear_group_key
    case source
    when ERROR
      error_fingerprint.presence ? "error:#{error_fingerprint}" : "feedback:#{id}"
    when BLOCK
      type_bug? || experience_block_id.blank? ? "feedback:#{id}" : "block:#{experience_block_id}"
    else
      "feedback:#{id}"
    end
  end

  def display_title
    return title if title.present?

    fallback = description.to_s.strip.split("\n").first.presence || "Feedback"
    fallback.truncate(80)
  end

  private

  def attachments_within_limits
    return unless attachments.attached?

    if attachments.size > MAX_ATTACHMENTS
      errors.add(:attachments, "must be #{MAX_ATTACHMENTS} files or fewer")
    end

    attachments.each do |attachment|
      unless ATTACHMENT_CONTENT_TYPES.include?(attachment.blob.content_type)
        errors.add(:attachments, "must be an image or video")
        break
      end

      if attachment.blob.byte_size > MAX_ATTACHMENT_BYTES
        errors.add(:attachments, "must each be under #{MAX_ATTACHMENT_BYTES / 1.megabyte} MB")
        break
      end
    end
  end
end
