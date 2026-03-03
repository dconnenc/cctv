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
