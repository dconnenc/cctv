require "rails_helper"

RSpec.describe Discovery::Feed do
  describe ".call" do
    it "includes the full curated theater list" do
      result = described_class.call

      expect(result[:theaters].size).to eq(ChicagoTheater.all.size)
      expect(result[:theaters].first).to include(:slug, :name, :neighborhood, :lat, :lng)
    end

    it "excludes past and unpublished events" do
      create(:event, title: "Past", starts_at: 3.days.ago, ends_at: 2.days.ago)
      create(:event, title: "Draft", published: false,
                     starts_at: 1.day.from_now, ends_at: 1.day.from_now + 2.hours)
      upcoming = create(:event, title: "Upcoming",
                                starts_at: 1.day.from_now, ends_at: 1.day.from_now + 2.hours)

      slugs = described_class.call[:events].map { |event| event[:slug] }

      expect(slugs).to contain_exactly(upcoming.slug)
    end

    it "keeps in-progress shows whose start has passed but have not ended" do
      in_progress = create(:event, title: "Happening",
                                   starts_at: 30.minutes.ago, ends_at: 1.hour.from_now)

      slugs = described_class.call[:events].map { |event| event[:slug] }

      expect(slugs).to include(in_progress.slug)
    end

    it "attaches a theater_slug for matched venues and nil otherwise" do
      matched = create(:event, venue_name: "The Den Theatre",
                               starts_at: 1.day.from_now, ends_at: 1.day.from_now + 1.hour)
      unmatched = create(:event, venue_name: "Backyard",
                                 starts_at: 2.days.from_now, ends_at: 2.days.from_now + 1.hour)

      by_slug = described_class.call[:events].index_by { |event| event[:slug] }

      expect(by_slug[matched.slug][:theater_slug]).to eq("the-den")
      expect(by_slug[unmatched.slug][:theater_slug]).to be_nil
    end

    it "ranks live shows first, then by soonest start" do
      live_experience = create(:experience, status: :live)
      live = create(:event, title: "Live now", experience: live_experience,
                            starts_at: 30.minutes.ago, ends_at: 1.hour.from_now)
      soon = create(:event, title: "Soon",
                            starts_at: 1.hour.from_now, ends_at: 2.hours.from_now)
      later = create(:event, title: "Later",
                             starts_at: 5.hours.from_now, ends_at: 6.hours.from_now)

      events = described_class.call[:events]

      expect(events.map { |event| event[:slug] }).to eq([live.slug, soon.slug, later.slug])
      expect(events.first[:is_live]).to be(true)
      expect(events.last[:is_live]).to be(false)
    end
  end
end
