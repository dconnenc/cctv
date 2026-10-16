module Tenants
  module Definitions
    Cctv = Config.new(
      key: "cctv",
      name: "CCTV",
      blocks: ExperienceBlock::KINDS,
      features: Config::FEATURES,
      theme: {
        display_name: "CCTV",
        tagline: "CHICAGO COMEDY . TV",
        site_name: "chicagocomedy.tv",
        description: "Interactive comedy experiences for live audiences.",
      },
    )
  end
end
