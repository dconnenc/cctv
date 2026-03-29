module Experiences
  class ForbiddenError < StandardError; end
  class InvalidTransitionError < StandardError; end
  class UnsafeEditError < StandardError; end

  class BaseService
    attr_reader :experience, :actor, :user
    def initialize(experience:, actor:)
      @experience = experience
      @actor = actor
      @user = actor
    end

    private

    def transaction
      ActiveRecord::Base.transaction do
        yield
      end
    end
  end
end
