require "rails_helper"

RSpec.describe Newsletter::SubscribeJob do
  let(:experience) { create(:experience) }
  let(:user)       { create(:user, email: "alice@example.com", name: "Alice Adams") }
  let(:participant) { create(:experience_participant, user: user, experience: experience, role: :audience) }
  let(:block) { create(:experience_block, experience: experience, kind: "newsletter_signup", status: "open") }

  def submission_with(answer)
    create(
      :experience_newsletter_submission,
      experience_block: block,
      experience_participant: participant,
      answer: answer
    )
  end

  it "subscribes the participant when they opted in" do
    submission = submission_with("subscribed" => true, "submittedAt" => Time.current.iso8601)

    expect(Newsletter::SenderClient).to receive(:subscribe).with(
      email: "alice@example.com",
      firstname: "Alice",
      lastname: "Adams"
    )

    described_class.perform_now(submission.id)
  end

  it "does nothing when the participant declined" do
    submission = submission_with("subscribed" => false, "submittedAt" => Time.current.iso8601)

    expect(Newsletter::SenderClient).not_to receive(:subscribe)

    described_class.perform_now(submission.id)
  end

  it "discards silently when the submission no longer exists" do
    expect(Newsletter::SenderClient).not_to receive(:subscribe)

    expect { described_class.perform_now(SecureRandom.uuid) }.not_to raise_error
  end
end
