class Api::EventsController < Api::BaseController
  authorize :user, through: :current_user

  # GET /api/events
  def index
    authorize! Event, to: :index?

    events = Event.published
                  .includes(:performers, :experience)
                  .order(starts_at: :asc)

    if params[:month].present? && params[:year].present?
      events = events.in_month(params[:month].to_i, params[:year].to_i)
    else
      events = events.upcoming.limit(50)
    end

    render json: {
      type: 'success',
      success: true,
      events: events.map { |e| EventSerializer.serialize_summary(e) }
    }
  end

  # GET /api/events/:slug
  def show
    event = Event.includes(:performers, :experience).find_by!(slug: params[:slug])

    authorize! event, to: :show?

    render json: {
      type: 'success',
      success: true,
      event: EventSerializer.serialize(event, current_user: current_user)
    }
  rescue ActiveRecord::RecordNotFound
    render json: { type: 'error', success: false, message: "Event not found" }, status: :not_found
  end

  # POST /api/events
  def create
    authorize! Event, to: :create?

    event = current_user.created_events.build(event_params)

    if event.save
      update_performers(event)

      render json: {
        type: 'success',
        success: true,
        event: EventSerializer.serialize(event.reload, current_user: current_user)
      }, status: :created
    else
      render json: {
        type: 'error',
        success: false,
        message: "Failed to create event",
        error: event.errors.full_messages.to_sentence
      }, status: :unprocessable_entity
    end
  end

  # PATCH /api/events/:slug
  def update
    event = Event.find_by!(slug: params[:slug])

    authorize! event, to: :update?

    if event.update(event_params)
      update_performers(event) if params[:performer_ids].present?

      render json: {
        type: 'success',
        success: true,
        event: EventSerializer.serialize(event.reload, current_user: current_user)
      }
    else
      render json: {
        type: 'error',
        success: false,
        message: "Failed to update event",
        error: event.errors.full_messages.to_sentence
      }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { type: 'error', success: false, message: "Event not found" }, status: :not_found
  end

  # DELETE /api/events/:slug
  def destroy
    event = Event.find_by!(slug: params[:slug])

    authorize! event, to: :destroy?

    event.destroy!

    render json: { type: 'success', success: true, message: "Event deleted" }
  rescue ActiveRecord::RecordNotFound
    render json: { type: 'error', success: false, message: "Event not found" }, status: :not_found
  end

  # GET /api/events/:slug/ical
  def ical
    event = Event.find_by!(slug: params[:slug])

    authorize! event, to: :ical?

    cal = <<~ICAL
      BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//CCTV//Events//EN
      BEGIN:VEVENT
      UID:#{event.id}@cctv
      DTSTART:#{event.starts_at.utc.strftime('%Y%m%dT%H%M%SZ')}
      DTEND:#{event.ends_at.utc.strftime('%Y%m%dT%H%M%SZ')}
      SUMMARY:#{ical_escape(event.title)}
      DESCRIPTION:#{ical_escape(event.description || '')}
      LOCATION:#{ical_escape([event.venue_name, event.venue_address].compact.join(', '))}
      END:VEVENT
      END:VCALENDAR
    ICAL

    send_data cal.gsub(/^ +/, ''),
              type: 'text/calendar; charset=utf-8',
              disposition: "attachment; filename=\"#{event.slug}.ics\"",
              filename: "#{event.slug}.ics"
  rescue ActiveRecord::RecordNotFound
    render json: { type: 'error', success: false, message: "Event not found" }, status: :not_found
  end

  private

  def event_params
    params.permit(:title, :description, :starts_at, :ends_at,
                  :venue_name, :venue_address, :pricing_text,
                  :ticket_url, :experience_id, :published)
  end

  def update_performers(event)
    performer_ids = Array(params[:performer_ids]).compact
    return if performer_ids.empty? && !params.key?(:performer_ids)

    event.event_performers.destroy_all
    performer_ids.each_with_index do |pid, idx|
      event.event_performers.create!(performer_id: pid, position: idx)
    end
  end

  def ical_escape(text)
    text.to_s.gsub('\\', '\\\\').gsub("\n", '\\n').gsub(',', '\\,').gsub(';', '\\;')
  end
end
