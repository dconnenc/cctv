module Tenants
  module Definitions
    SocialQuiztancing = Config.new(
      key: "social-quiztancing",
      name: "Social Quiztancing",
      blocks: %w[poll question announcement buzzer family_feud photo_upload feedback],
      features: [],
      theme: {
        display_name: "Social Quiztancing",
        tagline: "",
        site_name: "Social Quiztancing",
        description: "Live interactive quizzes for distanced crowds.",
        css_variables: {
          "--phosphor" => "#5cc8ff",
          "--phosphor-hsl" => "200 100% 68%",
          "--phosphor-glow-faint" => "rgba(92, 200, 255, 0.05)",
          "--phosphor-glow" => "rgba(92, 200, 255, 0.15)",
          "--phosphor-glow-light" => "rgba(92, 200, 255, 0.2)",
          "--phosphor-glow-medium" => "rgba(92, 200, 255, 0.35)",
          "--phosphor-glow-strong" => "rgba(92, 200, 255, 0.5)",
          "--tv-glow" => "0 0 4px rgba(92, 200, 255, 0.45), 0 0 10px rgba(92, 200, 255, 0.3)",
        },
      },
    )
  end
end
