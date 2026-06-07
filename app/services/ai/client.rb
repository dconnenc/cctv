module AI
  class Client
    class Error < StandardError; end

    def self.call(prompt:, response_schema: nil, model: nil, temperature: 0)
      provider.call(
        prompt: prompt,
        response_schema: response_schema,
        model: model,
        temperature: temperature
      )
    end

    def self.provider
      AI::Providers::Gemini
    end
  end
end
