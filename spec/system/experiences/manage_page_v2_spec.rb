require 'rails_helper'

RSpec.describe 'Manage page v2 UI', type: :system do
  let(:admin) { create(:user, :admin) }

  before { sign_in(admin) }

  scenario 'command bar, tabs, and panel actions work correctly' do
    create_experience_and_go_to_manage(name: 'Test Experience', code: 'test01')

    # Create a question block
    queue_block(n: 1) do
      select 'Question', from: 'Kind'
      fill_in 'Question', with: 'What is your favourite colour?'
    end

    select_block(1, kind: 'question')

    # Block tab is default
    within("[aria-label='Preview mode']") do
      expect(page).to have_css("button[aria-pressed='true']", text: /block/i)
      expect(page).to have_css("button[aria-pressed='false']", text: /screens/i)
    end

    # Screens tab shows Monitor/Participant sub-toggle
    within("[aria-label='Preview mode']") { click_button 'Screens' }
    expect(page).to have_button('Monitor')
    expect(page).to have_button('Participant')

    # Back to Block tab
    within("[aria-label='Preview mode']") do
      click_button 'Block'
    end

    # Block controls live in the command bar (not inside the detail panel)
    within('main > div:first-child') do
      expect(page).to have_button('Open')
    end

    # Open the block via the command bar
    present_block
    within('main > div:first-child') do
      expect(page).to have_button('Close')
      expect(page).to have_button('Next')
    end
    stop_presenting_block

    # Edit button is directly in the panel body
    edit_block
    click_button 'Cancel'

    # Participants drawer opens and closes
    within_participants_panel do
      expect(page).to have_text('Participants')
    end
  end

  it 'shows Public visibility badge in the Block tab for an untargeted block' do
    create_experience_and_go_to_manage(name: 'Vis Test', code: 'vis001')

    queue_block(n: 1) do
      select 'Question', from: 'Kind'
      fill_in 'Question', with: 'Favourite colour?'
    end
    select_block(1, kind: 'question')

    within("[aria-label='Preview mode']") do
      expect(page).to have_css("button[aria-pressed='true']", text: /block/i)
    end

    expect(page).to have_text('Public')
  end

  it 'shows the announcement message in the Block tab' do
    create_experience_and_go_to_manage(name: 'Ann Test', code: 'ann001')

    queue_block(n: 1) do
      select 'Announcement', from: 'Kind'
      fill_in 'Announcement Message', with: 'Welcome everyone!'
    end
    select_block(1, kind: 'announcement')

    expect(page).to have_text('Message')
    expect(page).to have_text('Welcome everyone!')
  end
end
