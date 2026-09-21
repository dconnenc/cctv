class Api::FeedbacksController < Api::BaseController
  # Auto-captured errors sync on a delay so a user who accepts the prompt can
  # enrich the report before the Linear issue is opened, rather than having the
  # detail arrive as a follow-up comment.
  ERROR_SYNC_DELAY = 90.seconds

  before_action :resolve_actor
  before_action :require_user, unless: :error_report?
  before_action :enforce_rate_limit, only: [:create]

  def create
    feedback = Feedback.new(feedback_attributes)
    feedback.attachments.attach(attachment_signed_ids) if attachment_signed_ids.any?

    if feedback.save
      enqueue_sync(feedback)
      track_event(Analytics::Events::FEEDBACK_SUBMITTED, feedback_event_properties(feedback))
      render json: { success: true, feedback: serialize(feedback) }, status: :created
    else
      render json: {
        success: false,
        error: feedback.errors.full_messages.first,
      }, status: :unprocessable_entity
    end
  end

  # Adds detail to a report the user already triggered — in practice, filling in
  # the prompt shown after a client error.
  def update
    feedback = Feedback.find_by(id: params[:id], user_id: @user.id)
    return render json: { success: false, error: "feedback not found" }, status: :not_found unless feedback

    feedback.attachments.attach(attachment_signed_ids) if attachment_signed_ids.any?

    if feedback.update(enrichment_attributes)
      # A pending sync has not built its issue body yet, so it will pick the new
      # detail up on its own. Only an already-synced issue needs a follow-up.
      Feedbacks::AppendEnrichmentJob.perform_later(feedback.id) if feedback.sync_synced?

      render json: { success: true, feedback: serialize(feedback) }
    else
      render json: {
        success: false,
        error: feedback.errors.full_messages.first,
      }, status: :unprocessable_entity
    end
  end

  private

  def serialize(feedback)
    {
      id: feedback.id,
      feedback_type: feedback.feedback_type,
      source: feedback.source,
      title: feedback.title,
      description: feedback.description,
      created_at: feedback.created_at,
    }
  end

  def feedback_attributes
    {
      user: @user,
      experience: @experience,
      experience_participant: @participant,
      experience_block: resolved_block,
      feedback_type: permitted_type,
      source: permitted_source,
      title: feedback_params[:title].presence,
      description: feedback_params[:description].presence,
      error_fingerprint: error_report? ? feedback_params[:error_fingerprint].presence : nil,
      context: Feedbacks::Sanitizer.context(raw_context),
      console_logs: Feedbacks::Sanitizer.console_logs(raw_console_logs),
    }
  end

  def enrichment_attributes
    {
      title: feedback_params[:title].presence,
      description: feedback_params[:description].presence,
      feedback_type: permitted_type,
    }.compact
  end

  def feedback_event_properties(feedback)
    {
      feedback_type: feedback.feedback_type,
      source: feedback.source,
      has_attachments: feedback.attachments.attached?,
      route: feedback.context["route"],
    }
  end

  def enqueue_sync(feedback)
    if feedback.source_error?
      Feedbacks::SyncToLinearJob
        .set(wait: ERROR_SYNC_DELAY)
        .perform_later(feedback.id, feedback.linear_group_key)
    else
      Feedbacks::SyncToLinearJob.perform_later(feedback.id, feedback.linear_group_key)
    end
  end

  def feedback_params
    @feedback_params ||= params.require(:feedback).permit(
      :feedback_type,
      :source,
      :title,
      :description,
      :experience_code,
      :experience_block_id,
      :error_fingerprint,
      context: Feedbacks::Sanitizer::PERMITTED_CONTEXT_KEYS.map(&:to_sym) + [{ segment_names: [], visible_block_kinds: [] }],
      console_logs: [:level, :at, :message],
      attachment_signed_ids: [],
    )
  end

  def raw_context
    feedback_params[:context]&.to_h || {}
  end

  def raw_console_logs
    Array(feedback_params[:console_logs]).map(&:to_h)
  end

  def attachment_signed_ids
    @attachment_signed_ids ||=
      Array(feedback_params[:attachment_signed_ids]).reject(&:blank?).first(Feedback::MAX_ATTACHMENTS)
  end

  def permitted_type
    type = feedback_params[:feedback_type].to_s
    Feedback::TYPES.include?(type) ? type : Feedback::GENERAL
  end

  def permitted_source
    source = feedback_params[:source].to_s
    Feedback::SOURCES.include?(source) ? source : Feedback::MANUAL
  end

  def error_report?
    permitted_source == Feedback::ERROR
  end

  def resolved_block
    return nil unless @experience

    id = feedback_params[:experience_block_id].presence
    return nil unless id

    @experience.experience_blocks.find_by(id: id)
  end

  # Feedback is global rather than scoped to one experience, so unlike the rest
  # of the API this resolves whoever happens to be present — a participant JWT, an
  # admin JWT, a browser session, or nobody at all for anonymous error reports.
  def resolve_actor
    if bearer_token
      resolve_actor_from_token
    else
      @user = current_user
    end

    @experience ||= Experience.find_by(code_slug: feedback_params[:experience_code].to_s.strip.presence)
    @participant ||= @experience&.experience_participants&.find_by(user_id: @user&.id) if @user
  end

  def resolve_actor_from_token
    claims = Experiences::AuthService.decode!(bearer_token)

    case claims[:scope]
    when Experiences::AuthService::PARTICIPANT
      @user, @experience = Experiences::AuthService.authorize_participant!(claims)
    when Experiences::AuthService::ADMIN
      @user = Experiences::AuthService.admin_from_claims!(claims)
    end
  rescue Experiences::AuthService::TokenInvalid,
         Experiences::AuthService::TokenExpired,
         Experiences::AuthService::Unauthorized,
         Experiences::AuthService::NotFound
    # An expired experience token should not block someone reporting a bug; fall
    # back to whatever session they have.
    @user = current_user
  end

  def require_user
    return if @user

    render json: { success: false, error: "Sign in to send feedback" }, status: :unauthorized
  end

  def enforce_rate_limit
    identifier = @user&.id || request.remote_ip

    return if Feedbacks::RateLimiter.allow?(source: permitted_source, identifier: identifier)

    render json: {
      success: false,
      error: "Too much feedback too quickly — try again shortly.",
    }, status: :too_many_requests
  end
end
