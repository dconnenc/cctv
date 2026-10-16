module Tenants
  module Definitions
    Cctv = Config.new(
      key: "cctv",
      name: "CCTV",
      blocks: ExperienceBlock::KINDS,
      features: Config::FEATURES,
      theme: { display_name: "CCTV" },
    )
  end
end
