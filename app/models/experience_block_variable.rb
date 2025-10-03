class ExperienceBlockVariable < ApplicationRecord
  belongs_to :experience_block
  has_many :bindings,
    class_name: "ExperienceBlockVariableBinding",
    foreign_key: :variable_id,
    dependent: :destroy
  has_many :source_blocks, through: :bindings

  enum datatype: {
    string: "string",
    number: "number",
    text: "text"
  }

  validates :key, :label, :datatype, presence: true
  validates :key, uniqueness: { scope: :experience_block_id }
end
