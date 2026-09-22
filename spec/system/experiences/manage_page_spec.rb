require 'rails_helper'

RSpec.describe 'Manage page UI', type: :system do
  let(:admin) { create(:user, :admin) }

  before { sign_in(admin) }

  scenario 'tabs, panel actions, and block content work correctly' do
    create_experience_and_go_to_manage(name: 'Test Experience', code: 'test01')

    queue_block(n: 1) do
      select 'Question', from: 'Kind'
      fill_in 'Question', with: 'What is your favourite colour?'
    end
    queue_block(n: 2) do
      select 'Announcement', from: 'Kind'
      fill_in 'Announcement Message', with: 'Welcome everyone!'
    end

    select_block(1, kind: 'question')

    # Block tab is default — metadata row shows config text
    expect(page).to have_text('What is your favourite colour?')
    expect(page).to have_text('Public')

    # Screens tab reveals Monitor and Participant sub-tabs
    click_button 'Screens'
    expect(page).to have_button('Monitor')
    expect(page).to have_button('Participant')

    # Block tab restores metadata view
    click_button 'Block'
    expect(page).to have_text('What is your favourite colour?')

    within('main > div:first-child') do
      expect(page).to have_button('Open')
    end

    present_block
    within('main > div:first-child') do
      expect(page).to have_button('Close')
      expect(page).to have_button('Next')
    end
    stop_presenting_block

    edit_block
    click_button 'Cancel'

    within_participants_panel do
      expect(page).to have_text('Participants')
    end

    select_block(2, kind: 'announcement')
    expect(page).to have_text('Welcome everyone!')
    expect(page).to have_text('Monitor: Yes')
  end
end
