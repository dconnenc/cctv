namespace :performers do
  desc "Import performers from a CSV export. Usage: rake performers:import[path/to/file.csv]"
  task :import, [:path] => :environment do |_task, args|
    path = args[:path]
    abort("Provide a CSV path: rake performers:import[path/to/file.csv]") if path.blank?
    abort("File not found: #{path}") unless File.exist?(path)

    # Optionally pin the ActiveStorage service for this run (e.g. STORAGE_SERVICE=amazon
    # to push to S3 from an environment whose default service is local disk).
    if (service = ENV["STORAGE_SERVICE"]).present?
      ActiveStorage::Blob.service = ActiveStorage::Blob.services.fetch(service.to_sym)
      puts "Using ActiveStorage service: #{service} (bucket=#{ENV['CCTV_AWS_S3_BUCKET']})"
    end

    force = ENV["FORCE_PHOTOS"].present?
    photos_dir = ENV["PHOTOS_DIR"]

    downloader =
      if photos_dir.present?
        abort("Photos dir not found: #{photos_dir}") unless Dir.exist?(photos_dir)
        Performers::LocalPhotoResolver.new(photos_dir)
      else
        Performers::DrivePhotoDownloader.new
      end

    result = Performers::CsvImporter.new(path, downloader: downloader, force_photos: force).call

    puts "Performer import complete: #{result.summary}"
    result.errors.each { |error| warn "  error: #{error}" }
  end
end
