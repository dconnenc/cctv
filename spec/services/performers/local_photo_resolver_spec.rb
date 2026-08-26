require "rails_helper"

RSpec.describe Performers::LocalPhotoResolver do
  # 1x1 transparent PNG.
  let(:png_bytes) do
    Base64.decode64(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )
  end

  let(:dir) { Dir.mktmpdir }

  after { FileUtils.remove_entry(dir) }

  def write_photo(filename)
    File.binwrite(File.join(dir, filename), png_bytes)
  end

  it "matches a plain display-name file" do
    write_photo("Sami Smith.png")
    expect(described_class.new(dir).call(name: "Sami Smith")&.filename).to eq("Sami Smith.png")
  end

  it "matches a file with a noisy prefix after the last ' - '" do
    write_photo("IMG_1926 - Derek Cox.jpeg")
    expect(described_class.new(dir).call(name: "Derek Cox")&.filename).to eq("IMG_1926 - Derek Cox.jpeg")
  end

  it "matches a shortened first name by prefix (Jes -> Jessica)" do
    write_photo("IMG_3537 - Jessica Benson.jpeg")
    expect(described_class.new(dir).call(name: "Jes Benson")&.filename).to eq("IMG_3537 - Jessica Benson.jpeg")
  end

  it "matches a single-token performer name against a fuller filename (Ateeq -> Ateeq Rehman)" do
    write_photo("IMG_5124 - Ateeq Rehman.png")
    expect(described_class.new(dir).call(name: "Ateeq")&.filename).to eq("IMG_5124 - Ateeq Rehman.png")
  end

  it "does not collide on first name alone when surnames differ" do
    write_photo("Sami Jones.png")
    expect(described_class.new(dir).call(name: "Sami Smith")).to be_nil
  end

  it "returns nil when no file matches" do
    write_photo("someone-else.png")
    expect(described_class.new(dir).call(name: "Tom Korabik")).to be_nil
  end

  it "skips ambiguous matches" do
    write_photo("IMG_1 - Derek Cox.png")
    write_photo("IMG_2 - Derek Cox.jpeg")
    expect(described_class.new(dir).call(name: "Derek Cox")).to be_nil
  end

  it "ignores non-image files" do
    File.write(File.join(dir, "Tom Korabik.txt"), "not an image")
    expect(described_class.new(dir).call(name: "Tom Korabik")).to be_nil
  end
end
