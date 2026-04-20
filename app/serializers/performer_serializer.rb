class PerformerSerializer
  def self.serialize(performer, current_user: nil, include_events: false)
    result = {
      id: performer.id,
      name: performer.name,
      bio: performer.bio,
      slug: performer.slug,
      photo_url: performer.photo_url,
      follower_count: performer.follower_count,
      followed_by_current_user: performer.followed_by?(current_user),
      editable_by_current_user: editable_by?(performer, current_user)
    }

    if include_events
      upcoming_events = performer.events
                                .published
                                .upcoming
                                .includes(:performers)
                                .order(starts_at: :asc)
                                .limit(20)

      result[:upcoming_events] = upcoming_events.map { |e| EventSerializer.serialize_for_performer(e) }
    end

    result
  end

  def self.serialize_summary(performer, current_user: nil)
    {
      id: performer.id,
      name: performer.name,
      bio: performer.bio,
      slug: performer.slug,
      photo_url: performer.photo_url,
      follower_count: performer.follower_count,
      followed_by_current_user: performer.followed_by?(current_user),
      editable_by_current_user: editable_by?(performer, current_user)
    }
  end

  def self.editable_by?(performer, user)
    return false unless user

    performer.user_id == user.id
  end
end
