module Minigames
  class ArithmeticQuestionGenerator
    EASY_OPS    = %w[+ -]
    MEDIUM_OPS  = %w[+ - * /]
    HARD_OPS    = %w[+ - * /]

    EASY_THRESHOLD   = 10
    MEDIUM_THRESHOLD = 20

    def self.generate(count:, seed: nil)
      new(count: count, seed: seed).generate
    end

    def initialize(count:, seed: nil)
      @count   = count.to_i
      @random  = seed ? Random.new(seed) : Random.new
    end

    def generate
      raise ArgumentError, "count must be positive" if @count <= 0

      Array.new(@count) do |index|
        build_question(index)
      end
    end

    private

    def build_question(index)
      operator   = pick_operator(index)
      lhs, rhs   = pick_operands(operator, index)
      answer     = compute(lhs, operator, rhs)

      {
        "index"  => index,
        "lhs"    => lhs,
        "op"     => operator,
        "rhs"    => rhs,
        "answer" => answer,
        "prompt" => "#{lhs} #{display_operator(operator)} #{rhs}"
      }
    end

    def pick_operator(index)
      pool =
        if index < EASY_THRESHOLD
          EASY_OPS
        elsif index < MEDIUM_THRESHOLD
          MEDIUM_OPS
        else
          HARD_OPS
        end

      pool.sample(random: @random)
    end

    def pick_operands(operator, index)
      max =
        if index < EASY_THRESHOLD
          12
        elsif index < MEDIUM_THRESHOLD
          20
        else
          50
        end

      case operator
      when "+"
        [@random.rand(1..max), @random.rand(1..max)]
      when "-"
        a = @random.rand(1..max)
        b = @random.rand(1..a)
        [a, b]
      when "*"
        cap = index < MEDIUM_THRESHOLD ? 12 : 15
        [@random.rand(2..cap), @random.rand(2..cap)]
      when "/"
        divisor  = @random.rand(2..12)
        quotient = @random.rand(2..(index < MEDIUM_THRESHOLD ? 12 : 15))
        dividend = divisor * quotient
        [dividend, divisor]
      end
    end

    def compute(lhs, operator, rhs)
      case operator
      when "+" then lhs + rhs
      when "-" then lhs - rhs
      when "*" then lhs * rhs
      when "/" then lhs / rhs
      end
    end

    def display_operator(operator)
      case operator
      when "*" then "×"
      when "/" then "÷"
      else operator
      end
    end
  end
end
