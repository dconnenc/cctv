require 'rails_helper'

RSpec.describe User, type: :model do
  describe '#most_recent_participant_name' do
    it 'returns nil when the user has no participants' do
      user = create(:user)
      expect(user.most_recent_participant_name).to be_nil
    end

    it 'returns the name from the most recently created participant' do
      user = create(:user)
      experience1 = create(:experience)
      experience2 = create(:experience)
      create(:experience_participant, user: user, experience: experience1, name: 'OldName', created_at: 2.days.ago)
      create(:experience_participant, user: user, experience: experience2, name: 'NewName', created_at: 1.day.ago)

      expect(user.most_recent_participant_name).to eq('NewName')
    end
  end

  describe '#most_recent_avatar' do
    it 'returns nil when the user has no participants' do
      user = create(:user)
      expect(user.most_recent_avatar).to be_nil
    end

    it 'returns nil when the most recent participant has an empty avatar' do
      user = create(:user)
      experience = create(:experience)
      create(:experience_participant, user: user, experience: experience, avatar: {})

      expect(user.most_recent_avatar).to be_nil
    end

    it 'returns the avatar from the most recently created participant' do
      user = create(:user)
      experience1 = create(:experience)
      experience2 = create(:experience)
      avatar_data = { 'strokes' => [{ 'points' => [1, 2, 3, 4], 'color' => '#ff0000', 'width' => 4 }] }
      create(:experience_participant, user: user, experience: experience1, avatar: avatar_data, created_at: 2.days.ago)
      create(:experience_participant, user: user, experience: experience2, avatar: { 'strokes' => [{ 'points' => [5, 6], 'color' => '#0000ff', 'width' => 2 }] }, created_at: 1.day.ago)

      expect(user.most_recent_avatar).to eq({ 'strokes' => [{ 'points' => [5, 6], 'color' => '#0000ff', 'width' => 2 }] })
    end
  end
end
