module TheScene
  # Determines which suggestions are eligible for voting in a given scene.
  #
  # TODO: in a future iteration, run AI clustering over the active suggestions
  #       to collapse near-duplicates ("a wedding" / "wedding scene" / "marriage
  #       party") into a single representative entry, optionally surfacing only
  #       the top-N by frequency. Wiring point: replace `active_for(block:)`
  #       with the clustered output. Frontend already trusts whatever this
  #       service returns as the votable pool.
  class Shortlist
    def self.active_for(block:)
      block.improv_suggestions.active.order(created_at: :asc)
    end
  end
end
