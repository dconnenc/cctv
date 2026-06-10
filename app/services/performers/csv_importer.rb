require "csv"

module Performers
  # Imports performers from a CSV export (e.g. a Google Form responses sheet).
  #
  # Columns are matched by header keyword so the importer tolerates the verbose
  # question-style headers Google Forms produces. Each row resolves a User by
  # email (creating one when absent), upserts that user's Performer profile, and
  # attaches the linked photo. Re-running is idempotent: existing performers are
  # updated in place and photos are only re-fetched when missing (or forced).
  class CsvImporter
    Result = Struct.new(:created, :updated, :skipped, :photos_attached, :errors, keyword_init: true) do
      def summary
        "created=#{created} updated=#{updated} skipped=#{skipped} " \
          "photos_attached=#{photos_attached} errors=#{errors.size}"
      end
    end

    def initialize(path, downloader: DrivePhotoDownloader.new, force_photos: false)
      @path = path
      @downloader = downloader
      @force_photos = force_photos
      @result = Result.new(created: 0, updated: 0, skipped: 0, photos_attached: 0, errors: [])
    end

    def call
      CSV.foreach(@path, headers: true) do |row|
        import_row(row)
      end

      @result
    end

    private

    def import_row(row)
      attrs = extract(row)

      if attrs[:email].blank? || attrs[:name].blank?
        @result.skipped += 1
        return
      end

      user = find_or_create_user(attrs)
      performer = upsert_performer(user, attrs)
      attach_photo(performer, attrs[:photo_url])
    rescue ActiveRecord::RecordInvalid => e
      @result.errors << "#{attrs[:email]}: #{e.message}"
    end

    def extract(row)
      mapped = {}
      row.each do |header, value|
        key = column_key(header)
        mapped[key] = value if key
      end

      {
        name: mapped[:name]&.strip,
        email: mapped[:email]&.strip&.downcase,
        bio: mapped[:bio]&.strip,
        photo_url: mapped[:photo_url]&.strip
      }
    end

    def column_key(header)
      normalized = header.to_s.downcase
      return :email if normalized.include?("email")
      return :photo_url if normalized.include?("photo") || normalized.include?("headshot")
      return :bio if normalized.include?("bio")
      return :name if normalized.include?("name")

      nil
    end

    def find_or_create_user(attrs)
      User.find_or_create_by!(email: attrs[:email]) do |user|
        user.name = attrs[:name]
        user.role = :user
      end
    end

    def upsert_performer(user, attrs)
      performer = Performer.find_or_initialize_by(user: user)
      new_record = performer.new_record?

      performer.name = attrs[:name]
      performer.bio = attrs[:bio]
      performer.save!

      new_record ? @result.created += 1 : @result.updated += 1
      performer
    end

    def attach_photo(performer, url)
      return if url.blank?
      return if performer.photo.attached? && !@force_photos

      photo = @downloader.call(url: url, name: performer.name)
      return if photo.nil?

      performer.photo.attach(
        io: photo.io,
        filename: photo.filename,
        content_type: photo.content_type
      )
      @result.photos_attached += 1
    end
  end
end
