require "rails_helper"

RSpec.describe "Active Storage tenancy" do
  let(:quiz) { Tenant.find_by!(key: "social-quiztancing") }

  def upload(filename = "photo.png")
    ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: filename, content_type: "image/png")
  end

  it "stamps blobs with the current tenant" do
    blob = ActsAsTenant.with_tenant(quiz) { upload }

    expect(blob.tenant_id).to eq(quiz.id)
  end

  it "does not find another tenant's blob by signed id" do
    signed_id = ActsAsTenant.with_tenant(quiz) { upload.signed_id }

    expect { ActiveStorage::Blob.find_signed!(signed_id) }.to raise_error(ActiveRecord::RecordNotFound)
    expect(ActsAsTenant.with_tenant(quiz) { ActiveStorage::Blob.find_signed!(signed_id) }).to be_present
  end

  it "stamps direct-upload blobs with the current tenant" do
    blob = ActsAsTenant.with_tenant(quiz) do
      ActiveStorage::Blob.create_before_direct_upload!(
        filename: "photo.png", byte_size: 3, checksum: Digest::MD5.base64digest("img"), content_type: "image/png",
      )
    end

    expect(blob.tenant_id).to eq(quiz.id)
  end

  it "stamps attachments and variant records with the current tenant" do
    ActsAsTenant.with_tenant(quiz) do
      experience = create(:experience)
      experience.attachments.attach(io: StringIO.new("img"), filename: "a.png", content_type: "image/png")
      blob = experience.attachments.first.blob
      variant_record = ActiveStorage::VariantRecord.create!(blob: blob, variation_digest: "digest")

      expect(experience.attachments.first.tenant_id).to eq(quiz.id)
      expect(variant_record.tenant_id).to eq(quiz.id)
    end
  end

  it "hides another tenant's attachments" do
    ActsAsTenant.with_tenant(quiz) do
      experience = create(:experience)
      experience.attachments.attach(io: StringIO.new("img"), filename: "a.png", content_type: "image/png")
    end

    expect(ActiveStorage::Attachment.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(0)
  end

  it "attaches files to experiences, feedback and drawing photos under their tenant" do
    ActsAsTenant.with_tenant(quiz) do
      experience = create(:experience)
      experience.attachments.attach(io: StringIO.new("img"), filename: "e.png", content_type: "image/png")

      feedback = create(:feedback)
      feedback.attachments.attach(io: StringIO.new("img"), filename: "f.png", content_type: "image/png")

      block = build(:experience_block, experience: experience, kind: ExperienceBlock::COLLABORATIVE_DRAWING)
      block.save!(validate: false)
      participant = create(:experience_participant, experience: experience)
      photo = ExperienceCollaborativeDrawingPhoto.create!(experience_block: block, experience_participant: participant)
      photo.photo.attach(io: StringIO.new("img"), filename: "d.png", content_type: "image/png")

      [experience.reload.attachments.first, feedback.reload.attachments.first, photo.reload.photo.attachment].each do |attachment|
        expect(attachment.tenant_id).to eq(quiz.id)
        expect(attachment.blob.tenant_id).to eq(quiz.id)
      end
    end
  end

  it "rejects an attachment pointing at another tenant's blob" do
    blob = ActsAsTenant.with_tenant(quiz) { upload }
    experience = create(:experience)
    attachment = ActiveStorage::Attachment.new(name: "attachments", record: experience, blob_id: blob.id)

    expect { attachment.save!(validate: false) }.to raise_error(ActiveRecord::InvalidForeignKey)
  end
end
