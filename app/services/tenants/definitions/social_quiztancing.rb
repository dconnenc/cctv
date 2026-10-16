module Tenants
  module Definitions
    SocialQuiztancing = Config.new(
      key: "social-quiztancing",
      name: "Social Quiztancing",
      blocks: %w[poll question announcement buzzer family_feud photo_upload feedback],
      features: [],
      theme: { display_name: "Social Quiztancing" },
    )
  end
end
