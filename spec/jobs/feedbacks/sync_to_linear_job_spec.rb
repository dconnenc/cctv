require "rails_helper"

RSpec.describe Feedbacks::SyncToLinearJob do
  let(:client) { instance_double(Linear::Client) }
  let(:issue) do
    { "id" => "issue-1", "identifier" => "CHI-42", "url" => "https://linear.app/i/CHI-42" }
  end

  before do
    allow(Linear::Config).to receive(:enabled?).and_return(true)
    allow(Linear::Config).to receive(:team_key).and_return("CHI")
    allow(Linear::Config).to receive(:project_id).and_return(nil)
    allow(Linear::Client).to receive(:new).and_return(client)
    allow(client).to receive(:team_id).and_return("team-1")
    allow(client).to receive(:label_id) { |_team, name| "label-#{name}" }
    allow(client).to receive(:create_issue).and_return(issue)
    allow(client).to receive(:create_comment).and_return({ "id" => "comment-1" })
  end

  it "creates an issue and records the identifier" do
    feedback = create(:feedback, :bug, title: "Poll never opened")

    described_class.perform_now(feedback.id, feedback.linear_group_key)

    expect(client).to have_received(:create_issue).with(
      hash_including(team_id: "team-1", title: "[Bug] Poll never opened"),
    )
    expect(feedback.reload).to have_attributes(
      sync_status: "synced",
      linear_issue_identifier: "CHI-42",
      linear_issue_url: "https://linear.app/i/CHI-42",
    )
  end

  it "comments on the existing issue instead of opening a second one for a repeat error" do
    first = create(:feedback, :error_report, :synced, error_fingerprint: "abc123")
    repeat = create(:feedback, :error_report, error_fingerprint: "abc123")

    described_class.perform_now(repeat.id, repeat.linear_group_key)

    expect(client).to have_received(:create_comment).with(
      hash_including(issue_id: first.linear_issue_id),
    )
    expect(client).not_to have_received(:create_issue)
    expect(repeat.reload.linear_issue_id).to eq(first.linear_issue_id)
    expect(first.reload.occurrence_count).to eq(2)
  end

  it "rolls repeat block feedback into one digest issue" do
    block = create(:experience_block, :feedback)
    root = create(:feedback, :from_block, :synced, experience_block: block, experience: block.experience)
    second = create(:feedback, :from_block, experience_block: block, experience: block.experience)

    described_class.perform_now(second.id, second.linear_group_key)

    expect(client).to have_received(:create_comment).with(hash_including(issue_id: root.linear_issue_id))
    expect(second.reload.linear_parent_feedback).to eq(root)
  end

  it "skips rather than fails when Linear is not configured" do
    allow(Linear::Config).to receive(:enabled?).and_return(false)
    feedback = create(:feedback)

    described_class.perform_now(feedback.id, feedback.linear_group_key)

    expect(feedback.reload.sync_status).to eq("skipped")
    expect(Linear::Client).not_to have_received(:new)
  end

  it "does not sync the same feedback twice" do
    feedback = create(:feedback, :synced)

    described_class.perform_now(feedback.id, feedback.linear_group_key)

    expect(client).not_to have_received(:create_issue)
  end

  it "uploads attachments into Linear so triage does not depend on our storage" do
    feedback = create(:feedback)
    feedback.attachments.attach(
      io: StringIO.new("png-bytes"),
      filename: "shot.png",
      content_type: "image/png",
    )
    allow(client).to receive(:upload_file).and_return("https://uploads.linear.app/shot.png")

    described_class.perform_now(feedback.id, feedback.linear_group_key)

    expect(client).to have_received(:upload_file).with(hash_including(filename: "shot.png"))
    expect(client).to have_received(:create_issue).with(
      hash_including(description: a_string_including("https://uploads.linear.app/shot.png")),
    )
  end
end
