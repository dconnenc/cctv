require "rails_helper"

# Guards that the controllers actually emit the analytics events. The Tracker
# itself is unit-tested in spec/services/analytics; here we confirm the wiring
# at representative call sites (the direct-capture path via #create and the
# track_event path via the lifecycle actions).
RSpec.describe Api::ExperiencesController, type: :controller do
  include Passwordless::ControllerHelpers

  let!(:experience) { create(:experience, status: :draft) }
  let(:admin) { create(:user, :admin) }

  # Capture the keyword args of every Tracker.capture call so assertions don't
  # depend on RSpec's keyword-vs-positional argument matching.
  let(:captured) { [] }

  before do
    sign_in(create_passwordless_session(admin))
    allow(Analytics::Tracker).to receive(:capture) { |**kwargs| captured << kwargs }
    allow(Analytics::Tracker).to receive(:identify_experience)
  end

  it "tracks experience creation and identifies the experience group" do
    post(:create, params: { experience: { name: "Show", code: "SHOW#{rand(100_000)}" } }, format: :json)

    expect(captured).to include(
      hash_including(event: Analytics::Events::EXPERIENCE_CREATED, distinct_id: admin.id),
    )
    expect(Analytics::Tracker).to have_received(:identify_experience).with(an_instance_of(Experience))
  end

  it "tracks lobby opening with the acting user as distinct_id" do
    post(:open_lobby, params: { id: experience.code_slug }, format: :json)

    expect(captured).to include(
      hash_including(event: Analytics::Events::LOBBY_OPENED, distinct_id: admin.id),
    )
  end

  it "tracks experience start" do
    post(:start, params: { id: experience.code_slug }, format: :json)

    expect(captured).to include(hash_including(event: Analytics::Events::EXPERIENCE_STARTED))
  end

  it "tracks experience pause" do
    experience.update!(status: :live)

    post(:pause, params: { id: experience.code_slug }, format: :json)

    expect(captured).to include(hash_including(event: Analytics::Events::EXPERIENCE_PAUSED))
  end

  it "tracks experience resume" do
    experience.update!(status: :paused)

    post(:resume, params: { id: experience.code_slug }, format: :json)

    expect(captured).to include(hash_including(event: Analytics::Events::EXPERIENCE_RESUMED))
  end
end
