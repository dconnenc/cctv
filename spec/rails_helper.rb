require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
require "capybara/cuprite"

# Prevent database truncation if the environment is production
abort("The Rails environment is running in production mode!") if Rails.env.production?

# Uncomment the line below in case you have `--require rails_helper` in the `.rspec` file
# that will avoid rails generators crashing because migrations haven't been run yet
# return unless Rails.env.test?
require 'rspec/rails'
require 'knapsack'

Knapsack::Adapters::RSpecAdapter.bind
Knapsack.tracker.config({
  enable_time_offset_warning: true,
  time_offset_in_seconds: 120
})
Knapsack.logger.level = Logger::FATAL
# Add additional requires below this line. Rails is not loaded until this point!

# Requires supporting ruby files with custom matchers and macros, etc, in
# spec/support/ and its subdirectories. Files matching `spec/**/*_spec.rb` are
# run as spec files by default. This means that files in spec/support that end
# in _spec.rb will both be required and run as specs, causing the specs to be
# run twice. It is recommended that you do not name files matching this glob to
# end with _spec.rb. You can configure this pattern with the --pattern
# option on the command line or in ~/.rspec, .rspec or `.rspec-local`.
#
# The following line is provided for convenience purposes. It has the downside
# of increasing the boot-up time by auto-requiring all files in the support
# directory. Alternatively, in the individual `*_spec.rb` files, manually
# require only the support files necessary.
#
Rails.root.glob('spec/support/**/*.rb').sort_by(&:to_s).each { |f| require f }

# Ensures that the test database schema matches the current schema file.
# If there are pending migrations it will invoke `db:test:prepare` to
# recreate the test database by loading the schema.
# If you are not using ActiveRecord, you can remove these lines.
begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end
RSpec.configure do |config|
  config.before(:each) do
    ActiveJob::Base.queue_adapter = :test
  end

  config.use_transactional_fixtures = true

  config.filter_rails_from_backtrace!
  config.include FactoryBot::Syntax::Methods
  config.include SystemHelpers, type: :system
end

# Keep this low, if you need to bump it, consider re-writing the test or using
# a custom wait for your use case
Capybara.default_max_wait_time = 6

# This is needed so we can assert on aria attributes
Capybara.enable_aria_label = true

RSpec.configure do |config|
  # Boot embedded Sidekiq once for the suite. Embedded sidekiq shares the
  # process. This is a slightly easier setup to maintain for testing, rather
  # than independently managing a process outside of the main tests
  config.before(:suite) do
    RSpec.configuration.add_setting :sidekiq_embedded
    next unless RSpec.configuration.files_to_run.any? { |f| f.include?("spec/system") }

    # Mimic reading the config file and creating the queues in our embedded
    # process
    sidekiq_yml = YAML.load_file(
      Rails.root.join("config/sidekiq.yml"), symbolize_names: true
    )
    sidekiq = Sidekiq.configure_embed do |cfg|
      cfg.queues = sidekiq_yml[:queues]
    end

    sidekiq.run

    # Store the instance on RSpec's configuration so the after(:suite) hook
    # below can reach it to call stop. Local variables don't survive between
    # separate before/after suite blocks, so this is the idiomatic way to
    # pass state across suite-level hooks.
    RSpec.configuration.sidekiq_embedded = sidekiq
  end

  config.after(:suite) do
    RSpec.configuration.sidekiq_embedded&.stop
  end

  config.before(:each, type: :system) do
    ActiveJob::Base.queue_adapter = :sidekiq
    driven_by :cuprite, screen_size: [1440, 900], options: {
      headless: ENV["HEADLESS"] != "false",
      process_timeout: 20,
      browser_options: { "force-prefers-reduced-motion" => nil }
    }
  end

  config.around(:each, type: :system) do |example|
    # Disable transactional tests so worker threads can see committed data.
    # Since rails 5+ this isn't needed for standard system tests as the
    # connection management is patched to allow the same connection to be used,
    # which means wrapping tests in a transaction works even for system tests.
    #
    # However, we run an embedded sidekiq process, which while sharing the
    # process, has it's own connection pool. This setup is to have the system
    # tests more closely represent the core pattern of the application when
    # running in production
    self.use_transactional_tests = false

    # See above, we need to manually clear the queue to avoid state leaking
    Sidekiq::Queue.all.each(&:clear)

    example.run

    # Retry on CI. Tests shouldn't be flakey, however github actions periodically
    # seems to run into failure states that are hard to account for in code.
    example.run if ENV["CI"].present? && example.exception

    # Truncate instead of rollback since we disabled transactions
    ActiveRecord::Base.connection.truncate_tables(
      *ActiveRecord::Base.connection.tables
        .reject { |t| %w[schema_migrations ar_internal_metadata].include?(t) }
    )

    # Catch all, we clear pre run, may as well clear post as well
    Sidekiq::Queue.all.each(&:clear)
  end
end
