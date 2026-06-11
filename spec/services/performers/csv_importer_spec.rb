require "rails_helper"

RSpec.describe Performers::CsvImporter do
  # Stub downloader so specs never hit the network. Returns a tiny PNG.
  let(:downloader) do
    Class.new do
      attr_reader :calls

      def initialize
        @calls = []
      end

      def call(url:, name: nil)
        @calls << url
        Performers::DrivePhotoDownloader::Result.new(
          io: StringIO.new("fakeimagebytes"),
          filename: "headshot.png",
          content_type: "image/png"
        )
      end
    end.new
  end

  def write_csv(rows)
    file = Tempfile.new(["performers", ".csv"])
    file.write(<<~HEADER)
      Timestamp,What is your name?,What is your email (for contact)?,Please upload a photo or headshot <10MB.,"Please add a short bio."
    HEADER
    rows.each { |row| file.write(CSV.generate_line(row)) }
    file.rewind
    file.path
  end

  let(:path) do
    write_csv([
      ["5/27/2026 14:54", "Jes Benson", "Jfaye3@gmail.com", "https://drive.google.com/open?id=ABC", "A teaching artist and comedian."],
      ["5/28/2026 14:32", "Derek Cox", "Derek.g.cox@gmail.com", "https://drive.google.com/open?id=DEF", "A director of photography."]
    ])
  end

  it "creates users and performers from the CSV" do
    result = described_class.new(path, downloader: downloader).call

    expect(result.created).to eq(2)
    expect(Performer.count).to eq(2)

    jes = Performer.find_by(name: "Jes Benson")
    expect(jes.bio).to eq("A teaching artist and comedian.")
    expect(jes.user.email).to eq("jfaye3@gmail.com")
    expect(jes.photo).to be_attached
  end

  it "reuses an existing user matched by email (case-insensitive)" do
    existing = create(:user, email: "jfaye3@gmail.com", name: "Existing Name")

    result = described_class.new(path, downloader: downloader).call

    expect(User.where(email: "jfaye3@gmail.com").count).to eq(1)
    expect(existing.reload.performer.name).to eq("Jes Benson")
    expect(result.created).to eq(2)
  end

  it "is idempotent across re-runs and does not re-download attached photos" do
    described_class.new(path, downloader: downloader).call
    second = described_class.new(path, downloader: downloader).call

    expect(Performer.count).to eq(2)
    expect(User.count).to eq(2)
    expect(second.updated).to eq(2)
    expect(second.created).to eq(0)
    # 2 downloads on first run, none on the second (photos already attached)
    expect(downloader.calls.size).to eq(2)
  end

  it "skips rows missing an email or name" do
    incomplete = write_csv([
      ["ts", "No Email", "", "https://drive.google.com/open?id=X", "bio"],
      ["ts", "", "no-name@gmail.com", "https://drive.google.com/open?id=Y", "bio"]
    ])

    result = described_class.new(incomplete, downloader: downloader).call

    expect(result.skipped).to eq(2)
    expect(Performer.count).to eq(0)
  end
end
