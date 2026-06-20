require "rails_helper"

RSpec.describe Api::BaseController, type: :controller do
  controller(described_class) do
    def trigger
      if params[:expected] == "true"
        raise Api::BaseController::NotFoundError, "expected control flow"
      else
        raise RuntimeError, "kaboom"
      end
    end
  end

  before do
    routes.draw { get "trigger" => "api/base#trigger" }
    allow(Analytics::Tracker).to receive(:capture_exception)
  end

  it "reports unexpected errors to PostHog and re-raises them unchanged" do
    expect { get :trigger }.to raise_error(RuntimeError, "kaboom")

    expect(Analytics::Tracker).to have_received(:capture_exception).with(
      an_instance_of(RuntimeError),
      hash_including(
        distinct_id: nil,
        properties: hash_including(action: "trigger", path: "/trigger", method: "GET"),
      ),
    )
  end

  it "does not report expected control-flow errors, but still re-raises them" do
    expect { get :trigger, params: { expected: "true" } }
      .to raise_error(Api::BaseController::NotFoundError)

    expect(Analytics::Tracker).not_to have_received(:capture_exception)
  end
end
