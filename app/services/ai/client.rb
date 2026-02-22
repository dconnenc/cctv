module AI
  class Client
    class Error < StandardError; end

    def self.call(prompt:, response_schema: nil)
      provider.call(prompt: prompt, response_schema: response_schema)
    end

    def self.provider
      AI::Providers::Gemini
    end
  end
end
