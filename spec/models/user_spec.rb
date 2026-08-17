require 'rails_helper'

RSpec.describe User, type: :model do
  describe '#most_recent_participant_name' do
    it 'returns nil when the user has no participants' do
      expect(create(:user).most_recent_participant_name).to be_nil
    end

    context "when a user has previously registered as a participant" do
      let(:user) { create(:user) }

      before do
        create(
          :experience_participant,
          user: user,
          name: 'OldName',
          created_at: 2.days.ago
        )

        create(
          :experience_participant,
          user: user,
          name: 'NewName',
          created_at: 1.day.ago
        )
      end

      it 'returns the name from the most recently created participant' do
        expect(user.most_recent_participant_name).to eq('NewName')
      end
    end
  end

  describe '#beta_tester?' do
    it 'is true for users created before the cutoff' do
      expect(build(:user, created_at: User::BETA_TESTER_CUTOFF - 1.day).beta_tester?).to be(true)
    end

    it 'is false for users created at or after the cutoff' do
      expect(build(:user, created_at: User::BETA_TESTER_CUTOFF).beta_tester?).to be(false)
    end
  end

  describe 'starter cosmetics on create' do
    before do
      create(:cosmetic, slug: 'everyone-hat', default_grant: true)
      create(:cosmetic, :frame, slug: 'beta-frame')
    end

    it 'grants default cosmetics to everyone and beta cosmetics only to beta testers' do
      beta = create(:user, created_at: Time.utc(2026, 1, 1))
      regular = create(:user, created_at: Time.utc(2026, 8, 1))

      expect(beta.cosmetics.pluck(:slug)).to include('everyone-hat', 'beta-frame')
      expect(regular.cosmetics.pluck(:slug)).to include('everyone-hat')
      expect(regular.cosmetics.pluck(:slug)).not_to include('beta-frame')
    end
  end

  describe '#most_recent_avatar' do
    it 'returns nil when the user has no participants' do
      expect(create(:user).most_recent_avatar).to be_nil
    end

    context "when a user has previously registered with no avatar" do
      let(:user) { create(:user) }

      before do
        create(
          :experience_participant,
          user: user,
          avatar: {}
        )
      end

      it 'returns nil' do
        expect(user.most_recent_avatar).to be_nil
      end
    end

    context "when a user has previously registered with no avatar" do
      let(:user) { create(:user) }
      let!(:experience_participant) do
        create(
          :experience_participant,
          :with_avatar,
          user: user
        )
      end

      it 'returns the avatar from the most recently created participant' do
        expect(user.most_recent_avatar).to eq(experience_participant.avatar)
      end
    end
  end
end
