module Experiences
  class ForbiddenError < StandardError; end
  class InvalidTransitionError < StandardError; end

  class BaseService
    include ActionPolicy::Behaviour
    authorize :user

    attr_reader :experience, :actor, :user
    def initialize(experience:, actor:)
      @experience = experience
      @actor = actor
      @user = actor
    end

    private

    def actor_action
      begin
        yield
      rescue ActionPolicy::Unauthorized => e
        raise Experiences::ForbiddenError.new(e.message)
      end
    end

    def transaction
      ActiveRecord::Base.transaction do
        yield
      end
    end
  end
end
