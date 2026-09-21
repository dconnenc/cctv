class Newsletter::SubscribeJob < ApplicationJob
  queue_as :default

  discard_on ActiveRecord::RecordNotFound
  retry_on Newsletter::SenderClient::Error, wait: :polynomially_longer, attempts: 5

  def perform(submission_id)
    submission = ExperienceNewsletterSubmission.find(submission_id)
    return unless submission.answer["subscribed"]

    user = submission.experience_participant.user
    return if user.email.blank?

    firstname, lastname = split_name(user.name)

    Newsletter::SenderClient.subscribe(
      email: user.email,
      firstname: firstname,
      lastname: lastname
    )
  end

  private

  def split_name(name)
    return [nil, nil] if name.blank?

    first, *rest = name.strip.split(/\s+/)
    [first, rest.join(" ").presence]
  end
end
