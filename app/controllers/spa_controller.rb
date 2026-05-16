class SpaController < ApplicationController
  SITE_NAME = "chicagocomedy.tv".freeze
  DEFAULT_TITLE = "chicagocomedy.tv".freeze
  DEFAULT_DESCRIPTION = "Interactive comedy experiences for live audiences.".freeze

  def index
    @og_site_name = SITE_NAME
    @og_url = request.original_url
    @og_image = "#{request.base_url}/icon.png"
    @og_type = "website"
    @og_title = DEFAULT_TITLE
    @og_description = DEFAULT_DESCRIPTION

    apply_route_metadata
  end

  private

  def apply_route_metadata
    case request.path
    when %r{\A/experiences/(?<code>[^/]+)(?<rest>/.*)?\z}
      code = Regexp.last_match[:code]
      rest = Regexp.last_match[:rest].to_s
      return if code == "register"

      experience = Experience.find_by_code_or_slug(code)
      return unless experience

      base_title = experience.name.presence || "Live experience"
      @og_title =
        if rest.start_with?("/register")
          "Join \"#{base_title}\""
        elsif rest.start_with?("/monitor")
          "#{base_title} — Monitor"
        else
          base_title
        end
      @og_description =
        experience.description.presence ||
        "Join \"#{base_title}\" — a live interactive experience on #{SITE_NAME}."
    when %r{\A/events/(?<slug>[^/]+)\z}
      event = Event.published.find_by(slug: Regexp.last_match[:slug])
      return unless event

      @og_type = "article"
      @og_title = event.title
      @og_description = build_event_description(event)
    when %r{\A/performers/(?<slug>[^/]+)\z}
      performer = Performer.find_by(slug: Regexp.last_match[:slug])
      return unless performer

      @og_type = "profile"
      @og_title = performer.name
      @og_description = performer.bio.presence ||
                        "#{performer.name} on #{SITE_NAME}."
      if performer.photo.attached?
        @og_image = Rails.application.routes.url_helpers.rails_blob_url(
          performer.photo,
          host: request.base_url
        )
      end
    when "/events"
      @og_title = "Events"
      @og_description = "Upcoming live comedy events on #{SITE_NAME}."
    when "/performers"
      @og_title = "Performers"
      @og_description = "Comedians and performers on #{SITE_NAME}."
    when "/about"
      @og_title = "About"
      @og_description = DEFAULT_DESCRIPTION
    when "/join"
      @og_title = "Join a show"
      @og_description = "Enter a code to join a live experience on #{SITE_NAME}."
    end
  end

  def build_event_description(event)
    parts = []
    parts << event.starts_at.strftime("%A, %B %-d · %-l:%M %p") if event.starts_at
    parts << event.venue_name if event.venue_name.present?
    summary = parts.join(" · ")

    if event.description.present?
      [summary.presence, event.description].compact.join(" — ")
    else
      summary.presence || "Live event on #{SITE_NAME}."
    end
  end
end
