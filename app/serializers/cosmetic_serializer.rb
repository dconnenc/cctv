class CosmeticSerializer
  def self.serialize(cosmetic)
    {
      id: cosmetic.id,
      name: cosmetic.name,
      slug: cosmetic.slug,
      kind: cosmetic.kind,
      category: cosmetic.category,
      asset_key: cosmetic.asset_key,
      default_placement: cosmetic.default_placement
    }
  end
end
