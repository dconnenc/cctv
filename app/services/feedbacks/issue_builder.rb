module Feedbacks
  # Renders a Feedback into the Linear issue (or rollup comment) body. Pure
  # formatting — no network calls — so it is cheap to test against fixtures.
  class IssueBuilder
    BASE_LABEL = "feedback".freeze
    AUTO_LABEL = "auto-reported".freeze

    TYPE_LABELS = {
      Feedback::BUG => "bug",
      Feedback::EXPERIENCE => "experience",
      Feedback::GENERAL => "general",
      Feedback::OTHER => "other"
    }.freeze

    CONTEXT_FIELDS = {
      "route" => "Route",
      "url" => "URL",
      "experience_code" => "Experience",
      "experience_status" => "Experience status",
      "participant_role" => "Participant role",
      "segment_names" => "Segments",
      "http_status" => "HTTP status",
      "http_url" => "Failed request",
      "viewport" => "Viewport",
      "user_agent" => "User agent",
      "release" => "Release"
    }.freeze

    def initialize(feedback, asset_urls: [])
      @feedback = feedback
      @asset_urls = asset_urls
    end

    def labels
      labels = [BASE_LABEL, TYPE_LABELS.fetch(@feedback.feedback_type, "other")]
      labels << AUTO_LABEL if @feedback.source_error?
      labels.uniq
    end

    def title
      case @feedback.source
      when Feedback::ERROR
        message = @feedback.context["error_message"].presence || "Client error"
        "[Error] #{message.to_s.truncate(120)}"
      when Feedback::BLOCK
        return "[Bug] #{@feedback.display_title}" if @feedback.type_bug?

        "Audience feedback — #{experience_label}"
      else
        "[#{TYPE_LABELS.fetch(@feedback.feedback_type, 'other').capitalize}] #{@feedback.display_title}"
      end
    end

    def description
      sections = []
      sections << digest_preamble if digest_root?
      sections << body_section
      sections << attachments_section
      sections << error_section
      sections << context_section
      sections << console_section
      sections << reporter_section
      sections.compact.join("\n\n")
    end

    # Body used when this feedback rolls into an existing issue rather than
    # opening its own.
    def comment
      sections = []
      sections << (@feedback.source_error? ? occurrence_heading : submission_heading)
      sections << body_section
      sections << attachments_section
      sections << context_section
      sections << reporter_section
      sections.compact.join("\n\n")
    end

    private

    def digest_root?
      @feedback.source_block? && !@feedback.type_bug?
    end

    def digest_preamble
      "Collected from the feedback block in #{experience_label}. " \
        "Each additional submission appears as a comment below."
    end

    def occurrence_heading
      "**Another occurrence** — #{timestamp}"
    end

    def submission_heading
      "**New submission** — #{timestamp}"
    end

    def body_section
      return nil if @feedback.description.blank?

      if digest_root? || @feedback.source_block?
        "> #{@feedback.description.to_s.strip.gsub("\n", "\n> ")}"
      else
        @feedback.description.to_s.strip
      end
    end

    def attachments_section
      return nil if @asset_urls.blank?

      lines = @asset_urls.map do |asset|
        if asset[:content_type].to_s.start_with?("image/")
          "![#{asset[:filename]}](#{asset[:url]})"
        else
          "[#{asset[:filename]}](#{asset[:url]})"
        end
      end

      (["### Attachments"] + lines).join("\n\n")
    end

    def error_section
      return nil unless @feedback.source_error?

      stack = @feedback.context["error_stack"].presence
      lines = ["### Error"]
      lines << "Source: `#{@feedback.context['error_source']}`" if @feedback.context["error_source"].present?
      lines << "Fingerprint: `#{@feedback.error_fingerprint}`" if @feedback.error_fingerprint.present?
      lines << "```\n#{stack.to_s.truncate(4_000)}\n```" if stack
      lines.join("\n\n")
    end

    def context_section
      rows = CONTEXT_FIELDS.filter_map do |key, label|
        value = @feedback.context[key]
        value = value.join(", ") if value.is_a?(Array)
        next if value.blank?

        "| #{label} | #{value.to_s.truncate(300).gsub('|', '\\|')} |"
      end

      replay = @feedback.context["posthog_replay_url"].presence
      rows << "| Session replay | [Watch](#{replay}) |" if replay

      return nil if rows.empty?

      (["### Context", "| Field | Value |", "| --- | --- |"] + rows).join("\n")
    end

    def console_section
      logs = @feedback.console_logs
      return nil if logs.blank?

      lines = logs.map { |entry| "[#{entry['level']}] #{entry['message']}" }
      body = lines.join("\n").truncate(8_000)

      "### Console\n\n```\n#{body}\n```"
    end

    def reporter_section
      reporter = @feedback.user ? "#{@feedback.user.name} (#{@feedback.user.email})" : "Anonymous"
      "_Reported by #{reporter} at #{timestamp}._"
    end

    def experience_label
      @feedback.experience&.name.presence || @feedback.context["experience_code"].presence || "unknown experience"
    end

    def timestamp
      @feedback.created_at&.utc&.strftime("%Y-%m-%d %H:%M UTC") || "unknown time"
    end
  end
end
