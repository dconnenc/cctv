require "open-uri"

module Performers
  # Downloads a photo from a public URL (handling Google Drive share links) and
  # returns the data needed to attach it via ActiveStorage. Returns nil when the
  # URL is blank, cannot be fetched, or does not resolve to an image (e.g. Google
  # Drive's HTML interstitial for non-public files).
  class DrivePhotoDownloader
    MAX_BYTES = 10.megabytes
    DRIVE_HOST = "drive.google.com".freeze

    Result = Struct.new(:io, :filename, :content_type, keyword_init: true)

    def call(url:, name: nil)
      return nil if url.blank?

      download_url = normalize(url.strip)
      io = URI.parse(download_url).open(
        "rb",
        read_timeout: 30,
        "User-Agent" => "cctv-performer-importer"
      )

      content_type = io.content_type.presence || Marcel::MimeType.for(io)
      return nil unless content_type.to_s.start_with?("image/")
      return nil if io.size && io.size > MAX_BYTES

      Result.new(
        io: io,
        filename: filename_for(io, download_url, content_type),
        content_type: content_type
      )
    rescue OpenURI::HTTPError, SocketError, URI::InvalidURIError, Net::OpenTimeout, Net::ReadTimeout => e
      Rails.logger.warn("[Performers::DrivePhotoDownloader] failed to fetch #{url}: #{e.message}")
      nil
    end

    private

    # Converts a Google Drive share/preview link into a direct-download URL.
    # Leaves non-Drive URLs untouched.
    def normalize(url)
      return url unless url.include?(DRIVE_HOST)

      id = drive_file_id(url)
      return url if id.nil?

      "https://#{DRIVE_HOST}/uc?export=download&id=#{id}"
    end

    def drive_file_id(url)
      url[%r{/file/d/([^/]+)}, 1] ||
        url[/[?&]id=([^&]+)/, 1] ||
        url[%r{/d/([^/?]+)}, 1]
    end

    def filename_for(io, url, content_type)
      from_disposition = io.meta["content-disposition"].to_s[/filename="?([^"]+)"?/, 1]
      return from_disposition if from_disposition.present?

      ext = Rack::Mime::MIME_TYPES.invert[content_type.to_s.split(";").first] || ".jpg"
      "performer-photo#{ext}"
    end
  end
end
