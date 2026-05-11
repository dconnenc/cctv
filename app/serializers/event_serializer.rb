class EventSerializer
  def self.serialize(event, current_user: nil)
    {
      id: event.id,
      title: event.title,
      description: event.description,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      venue_name: event.venue_name,
      venue_address: event.venue_address,
      pricing_text: event.pricing_text,
      ticket_url: event.ticket_url,
      slug: event.slug,
      published: event.published,
      performers: serialize_performers(event, current_user: current_user),
      experience: serialize_experience(event),
      created_at: event.created_at,
      updated_at: event.updated_at
    }
  end

  def self.serialize_summary(event)
    {
      id: event.id,
      title: event.title,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      venue_name: event.venue_name,
      venue_address: event.venue_address,
      pricing_text: event.pricing_text,
      ticket_url: event.ticket_url,
      slug: event.slug,
      performers: event.performers.map { |p|
        { id: p.id, name: p.name, slug: p.slug }
      }
    }
  end

  def self.serialize_for_performer(event)
    {
      id: event.id,
      title: event.title,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      venue_name: event.venue_name,
      slug: event.slug
    }
  end

  private_class_method

  def self.serialize_performers(event, current_user: nil)
    event.performers.map do |performer|
      {
        id: performer.id,
        name: performer.name,
        slug: performer.slug,
        photo_url: performer.photo_url,
        followed_by_current_user: performer.followed_by?(current_user)
      }
    end
  end

  def self.serialize_experience(event)
    return nil unless event.experience_id.present?

    experience = event.experience
    return nil unless experience

    {
      code_slug: experience.code_slug,
      status: experience.status,
      active: event.active?
    }
  end
end
