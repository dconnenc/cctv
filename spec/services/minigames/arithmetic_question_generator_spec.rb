require "rails_helper"

RSpec.describe Minigames::ArithmeticQuestionGenerator do
  describe ".generate" do
    it "generates the requested number of questions" do
      questions = described_class.generate(count: 25, seed: 1)
      expect(questions.size).to eq(25)
    end

    it "returns sequential index values starting at zero" do
      questions = described_class.generate(count: 5, seed: 1)
      expect(questions.map { |q| q["index"] }).to eq([0, 1, 2, 3, 4])
    end

    it "computes correct answers for every question" do
      questions = described_class.generate(count: 50, seed: 42)
      questions.each do |q|
        expected =
          case q["op"]
          when "+" then q["lhs"] + q["rhs"]
          when "-" then q["lhs"] - q["rhs"]
          when "*" then q["lhs"] * q["rhs"]
          when "/" then q["lhs"] / q["rhs"]
          end
        expect(q["answer"]).to eq(expected), "mismatch on #{q.inspect}"
      end
    end

    it "uses only + and - operators in the first 10 questions" do
      questions = described_class.generate(count: 10, seed: 7)
      ops = questions.map { |q| q["op"] }.uniq
      expect(ops - %w[+ -]).to eq([])
    end

    it "may use multiplication or division in questions 11-20" do
      questions = described_class.generate(count: 20, seed: 7).last(10)
      ops = questions.map { |q| q["op"] }
      expect(ops.all? { |op| %w[+ - * /].include?(op) }).to be(true)
    end

    it "produces integer-valued division (no remainders)" do
      questions = described_class.generate(count: 60, seed: 2024)
      div_questions = questions.select { |q| q["op"] == "/" }
      div_questions.each do |q|
        expect(q["lhs"] % q["rhs"]).to eq(0), "non-integer division: #{q.inspect}"
      end
    end

    it "produces non-negative subtraction results" do
      questions = described_class.generate(count: 40, seed: 99)
      sub_questions = questions.select { |q| q["op"] == "-" }
      sub_questions.each do |q|
        expect(q["answer"]).to be >= 0
      end
    end

    it "raises when count is not positive" do
      expect { described_class.generate(count: 0) }.to raise_error(ArgumentError)
    end
  end
end
