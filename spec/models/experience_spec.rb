require 'rails_helper'

RSpec.describe Experience, type: :model do
  let(:creator) { create(:user) }

  describe "validations" do
    subject { build(:experience, creator: creator) }

    it "is valid with valid attributes" do
      expect(subject).to be_valid
    end

    describe "code" do
      it "requires presence" do
        subject.code = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:code]).to include("can't be blank")
      end

      it "requires uniqueness" do
        create(:experience, code: 'TEST123', creator: creator)
        subject.code = 'TEST123'
        expect(subject).not_to be_valid
        expect(subject.errors[:code]).to include('has already been taken')
      end

      it "is case-insensitive for uniqueness" do
        create(:experience, code: 'TestCode', creator: creator)
        subject.code = 'testcode'
        expect(subject).not_to be_valid
        expect(subject.errors[:code]).to include('has already been taken')
      end

      it "preserves the original case" do
        subject.code = 'MyTestCode'
        subject.save!
        expect(subject.code).to eq('MyTestCode')
      end
    end

    describe "code_slug" do
      it "requires presence after generation" do
        subject.code = 'TEST'
        expect(subject).to be_valid
        expect(subject.code_slug).to eq('test')

        subject.save!
        subject.update_column(:code_slug, '')
        subject.reload
        expect(subject).not_to be_valid
        expect(subject.errors[:code_slug]).to include("can't be blank")
      end

      it "requires uniqueness" do
        existing = create(:experience, code: 'TEST', creator: creator)
        expect(existing.code_slug).to eq('test')

        duplicate = create(:experience, code: 'DIFFERENT', creator: creator)
        expect(duplicate.code_slug).to eq('different')

        duplicate.instance_variable_set(:@code_changed, false)
        duplicate.code_slug = 'test'

        expect(duplicate).not_to be_valid
        expect(duplicate.errors[:code_slug]).to include('has already been taken')
      end
    end
  end

  describe "code slug generation" do
    subject { create(:experience, creator: creator, code: code) }

    context "with alphanumeric code" do
      let(:code) { 'MyTest123' }

      it "generates a URL-safe slug" do
        expect(subject.code_slug).to eq('mytest123')
      end
    end

    context "with uppercase letters" do
      let(:code) { 'UPPERCASE' }

      it "converts to lowercase" do
        expect(subject.code_slug).to eq('uppercase')
      end
    end

    context "with spaces" do
      let(:code) { 'My Test Code' }

      it "replaces spaces with hyphens" do
        expect(subject.code_slug).to eq('my-test-code')
      end
    end

    context "with special characters" do
      let(:code) { 'Test@Code#2024' }

      it "replaces them with hyphens" do
        expect(subject.code_slug).to eq('test-code-2024')
      end
    end

    context "with multiple consecutive spaces" do
      let(:code) { 'Test   Code' }

      it "collapses multiple hyphens into one" do
        expect(subject.code_slug).to eq('test-code')
      end
    end

    context "with leading and trailing special characters" do
      let(:code) { '!Test!' }

      it "removes them" do
        expect(subject.code_slug).to eq('test')
      end
    end

    context "with existing hyphens" do
      let(:code) { 'Test-Code-2024' }

      it "preserves them" do
        expect(subject.code_slug).to eq('test-code-2024')
      end
    end

    context "with mixed alphanumeric and special characters" do
      let(:code) { 'My*Super&Test_123!' }

      it "creates proper slug" do
        expect(subject.code_slug).to eq('my-super-test-123')
      end
    end

    context "when code is updated" do
      let(:code) { 'Original' }

      it "regenerates the slug" do
        expect(subject.code_slug).to eq('original')

        subject.update(code: 'Updated Code')
        expect(subject.code_slug).to eq('updated-code')
      end
    end

    context "when other attributes change" do
      let(:code) { 'Test' }

      it "does not regenerate slug" do
        original_slug = subject.code_slug

        subject.update(name: 'New Name')
        expect(subject.code_slug).to eq(original_slug)
      end
    end

    context "with only special characters" do
      let(:code) { '!!!' }

      it "fails validation" do
        experience = build(:experience, creator: creator, code: code)
        expect(experience).not_to be_valid
        expect(experience.errors[:code_slug]).to include("can't be blank")
      end
    end
  end

  describe "case-insensitive code lookups" do
    let!(:experience) { create(:experience, code: 'TestCode', creator: creator) }

    it "finds experiences case-insensitively" do
      found_upper = Experience.find_by(code: 'TESTCODE')
      found_lower = Experience.find_by(code: 'testcode')
      found_mixed = Experience.find_by(code: 'TestCode')

      expect(found_upper).to eq(experience)
      expect(found_lower).to eq(experience)
      expect(found_mixed).to eq(experience)
    end
  end

  describe ".find_by_code" do
    let!(:experience) { create(:experience, code: 'MyCode', creator: creator) }

    it "finds by code case-insensitively" do
      expect(Experience.find_by_code('mycode')).to eq(experience)
      expect(Experience.find_by_code('MYCODE')).to eq(experience)
      expect(Experience.find_by_code('MyCode')).to eq(experience)
    end
  end

  describe ".find_by_slug" do
    let!(:experience) { create(:experience, code: 'My Code!', creator: creator) }

    it "finds by slug" do
      expect(experience.code_slug).to eq('my-code')
      expect(Experience.find_by_slug('my-code')).to eq(experience)
    end

    it "returns nil for non-existent slug" do
      expect(Experience.find_by_slug('nonexistent')).to be_nil
    end
  end
end
