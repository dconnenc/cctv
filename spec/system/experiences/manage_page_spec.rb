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

    click_button 'More options'
    expect(page).to have_text('Focus')
    expect(page).to have_text('Timeline')
    expect(page).to have_text('Playbill')
    expect(page).to have_text('Debug')
    send_keys(:escape)

    expect(page).to have_text('What is your favourite colour?')

    within("[aria-label='Preview mode']") do
      expect(page).to have_css("button[aria-pressed='true']", text: /block/i)
      expect(page).to have_css("button[aria-pressed='false']", text: /screens/i)
    end

    expect(page).to have_text('Public')

    within("[aria-label='Preview mode']") { click_button 'Screens' }
    expect(page).to have_button('Monitor')
    expect(page).to have_button('Participant')

    within("[aria-label='Preview mode']") { click_button 'Block' }

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
