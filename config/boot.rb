ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

env_file = File.expand_path("../.env", __dir__)
if ENV["RAILS_ENV"] != "production" && File.exist?(env_file)
  File.foreach(env_file) do |line|
    line = line.strip
    next if line.empty? || line.start_with?("#")
    key, _, value = line.partition("=")
    ENV[key.strip] ||= value.strip.gsub(/\A["']|["']\z/, "")
  end
end

require "bundler/setup" # Set up gems listed in the Gemfile.
require "bootsnap/setup" # Speed up boot time by caching expensive operations.
