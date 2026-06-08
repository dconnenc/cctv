class ChicagoTheater
  attr_reader :slug, :name, :neighborhood, :lat, :lng, :aliases

  def initialize(slug:, name:, neighborhood:, lat:, lng:, aliases: [])
    @slug = slug
    @name = name
    @neighborhood = neighborhood
    @lat = lat
    @lng = lng
    @aliases = aliases
  end

  def as_json(*)
    { slug: slug, name: name, neighborhood: neighborhood, lat: lat, lng: lng }
  end

  ALL = [
    new(slug: "second-city", name: "The Second City", neighborhood: "Old Town",
        lat: 41.9117, lng: -87.6347, aliases: ["Second City"]),
    new(slug: "io-theater", name: "iO Theater", neighborhood: "Near North",
        lat: 41.9089, lng: -87.6529, aliases: ["iO", "iO Chicago", "iO Theatre", "Improv Olympic"]),
    new(slug: "annoyance", name: "The Annoyance Theatre", neighborhood: "Lakeview",
        lat: 41.9396, lng: -87.6525, aliases: ["Annoyance", "The Annoyance", "Annoyance Theatre"]),
    new(slug: "the-den", name: "The Den Theatre", neighborhood: "Wicker Park",
        lat: 41.9068, lng: -87.6722, aliases: ["The Den", "Den Theatre", "Den Theater", "The Den Theater"]),
    new(slug: "laugh-factory", name: "Laugh Factory Chicago", neighborhood: "Lakeview",
        lat: 41.9403, lng: -87.6448, aliases: ["Laugh Factory"]),
    new(slug: "zanies", name: "Zanies Comedy Club", neighborhood: "Old Town",
        lat: 41.9112, lng: -87.6346, aliases: ["Zanies", "Zanies Chicago"]),
    new(slug: "lincoln-lodge", name: "The Lincoln Lodge", neighborhood: "Logan Square",
        lat: 41.9189, lng: -87.6870, aliases: ["Lincoln Lodge"]),
    new(slug: "comedy-bar", name: "Comedy Bar", neighborhood: "River North",
        lat: 41.8907, lng: -87.6324, aliases: ["Comedy Bar Chicago"]),
    new(slug: "the-hideout", name: "The Hideout", neighborhood: "Bucktown",
        lat: 41.9133, lng: -87.6614, aliases: ["Hideout"]),
    new(slug: "logan-square-improv", name: "Logan Square Improv", neighborhood: "Logan Square",
        lat: 41.9265, lng: -87.708, aliases: ["LSI", "Logan Square Improv Theater"]),
  ].freeze

  def self.all
    ALL
  end

  def self.find(slug)
    ALL.find { |theater| theater.slug == slug }
  end

  def self.match(venue_name)
    return nil if venue_name.nil? || venue_name.strip.empty?

    key = normalize(venue_name)
    ALL.find do |theater|
      ([theater.name] + theater.aliases).any? { |candidate| normalize(candidate) == key }
    end
  end

  def self.normalize(value)
    value.to_s.downcase.gsub(/[^a-z0-9]/, "")
  end
end
