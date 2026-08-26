module Performers
  # Resolves a performer's photo from a local directory instead of a URL, for
  # cases where the source images are behind auth (e.g. private Google Drive)
  # and have been downloaded by hand.
  #
  # Real-world downloads carry noisy names like "IMG_3537 - Jessica Benson.jpeg"
  # or "Capture - Taylor Jones.JPG", so matching: takes the name portion after
  # the last " - " (when present), tokenizes it, and matches a performer when
  # every token of the performer's name maps to a file token by equality or
  # prefix (e.g. CSV "Jes Benson" matches file token "jessica"). Surnames must
  # match for multi-word names. Ambiguous matches are skipped with a warning.
  class LocalPhotoResolver
    Result = DrivePhotoDownloader::Result

    Candidate = Struct.new(:path, :tokens, keyword_init: true)

    def initialize(dir)
      @dir = dir
      @candidates = build_candidates
    end

    def call(url: nil, name:)
      return nil if name.blank?

      tokens = tokenize(name)
      return nil if tokens.empty?

      matches = @candidates.select { |candidate| matches?(tokens, candidate.tokens) }

      if matches.size > 1
        Rails.logger.warn(
          "[Performers::LocalPhotoResolver] ambiguous match for #{name.inspect}: " \
          "#{matches.map { |m| File.basename(m.path) }.join(', ')}"
        )
        return nil
      end

      candidate = matches.first
      return nil if candidate.nil?

      content_type = Marcel::MimeType.for(Pathname.new(candidate.path))
      return nil unless content_type.to_s.start_with?("image/")

      Result.new(
        io: File.open(candidate.path, "rb"),
        filename: File.basename(candidate.path),
        content_type: content_type
      )
    end

    private

    def build_candidates
      Dir.glob(File.join(@dir, "*")).filter_map do |path|
        next if File.directory?(path)

        tokens = tokenize(name_portion(path))
        next if tokens.empty?

        Candidate.new(path: path, tokens: tokens)
      end
    end

    # "IMG_3537 - Jessica Benson.jpeg" -> "Jessica Benson"; "Sami Smith.png" -> "Sami Smith"
    def name_portion(path)
      base = File.basename(path, ".*")
      base.include?(" - ") ? base.split(" - ").last : base
    end

    def tokenize(value)
      value.to_s.downcase.scan(/[a-z0-9]+/)
    end

    # Every performer token must map to a file token (equality or prefix in
    # either direction). For multi-token names the surname must match exactly,
    # to avoid first-name-only collisions.
    def matches?(performer_tokens, file_tokens)
      surname_ok = performer_tokens.size < 2 || file_tokens.include?(performer_tokens.last)
      surname_ok && performer_tokens.all? do |token|
        file_tokens.any? { |ft| token == ft || ft.start_with?(token) || token.start_with?(ft) }
      end
    end
  end
end
