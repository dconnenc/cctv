RSpec.shared_context "without vite assets" do
  before do
    allow_any_instance_of(ActionView::Base).to receive(:vite_typescript_tag).and_return("")
    allow_any_instance_of(ActionView::Base).to receive(:vite_client_tag).and_return("")
    allow_any_instance_of(ActionView::Base).to receive(:vite_react_refresh_tag).and_return("")
  end
end
