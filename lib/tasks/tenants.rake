namespace :tenants do
  desc "Upsert tenant rows for every registered tenant config"
  task sync: :environment do
    Tenants::Sync.call.each { |tenant| puts "tenant #{tenant.key}" }
  end
end
