module Discovery
  # Builds the payload for the desktop home + browse-events map experience:
  # the full curated theater list (for every dot) and the upcoming shows
  # ranked live-first then soonest, each tagged with its matched theater.
  class Feed
    def self.call(now: Time.current)
      new(now: now).call
    end

    def initialize(now: Time.current)
      @now = now
    end

    def call
      {
        theaters: ChicagoTheater.all.map(&:as_json),
        events: ranked_events.map { |event| serialize(event) }
      }
    end

    private

    attr_reader :now

    def ranked_events
      Event.published
           .where("ends_at >= ?", now)
           .includes(:performers, :experience)
           .order(starts_at: :asc)
           .to_a
           .sort_by { |event| [event.active? ? 0 : 1, event.starts_at] }
    end

    def serialize(event)
      theater = ChicagoTheater.match(event.venue_name)

      if theater.nil? && event.venue_name.present?
        Rails.logger.info("[discover] unmatched venue: #{event.venue_name.inspect}")
      end

      EventSerializer.serialize_summary(event).merge(
        theater_slug: theater&.slug,
        is_live: event.active?
      )
    end
  end
end
