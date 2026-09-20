class ExperienceCollaborativeDrawingAssignment < ApplicationRecord
  belongs_to :experience_block
  belongs_to :experience_participant
  belongs_to :source_photo,
    class_name: "ExperienceCollaborativeDrawingPhoto",
    optional: true

  validates :group_index, :slice_index, :slice_count,
    numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :experience_participant_id, uniqueness: { scope: :experience_block_id }

  scope :submitted, -> { where.not(submitted_at: nil) }

  def submitted?
    submitted_at.present?
  end

  # The fractional (x, y, w, h) rectangle of the source photo this slice covers.
  # Slices tile the photo as a grid packed into as-square-as-possible rows: 2 →
  # top/bottom, 3 → one on top and two below, 4 → a 2x2, and so on. Row-major
  # order maps slice_index to a cell.
  def self.grid_region(slice_index:, slice_count:)
    count = [slice_count.to_i, 1].max
    index = slice_index.to_i.clamp(0, count - 1)
    rows  = Math.sqrt(count).ceil
    base  = count / rows
    remainder = count % rows
    row_sizes = Array.new(rows) { |r| r < rows - remainder ? base : base + 1 }

    row = 0
    col = index
    row_sizes.each_with_index do |size, r|
      if col < size
        row = r
        break
      end
      col -= size
    end
    cols = row_sizes[row]

    {
      "x" => (col.to_f / cols).round(6),
      "y" => (row.to_f / rows).round(6),
      "w" => (1.0 / cols).round(6),
      "h" => (1.0 / rows).round(6)
    }
  end

  def grid_region
    self.class.grid_region(slice_index: slice_index, slice_count: slice_count)
  end
end
