Rails.application.config.to_prepare do
  Passwordless::Mailer.prepend(TenantMailerUrlOptions)
end
