module AI
  module Providers
    class Gemini
      API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

      def self.call(prompt:, response_schema: nil)
        api_key = ENV["GEMINI_API_KEY"]
        raise AI::Client::Error, "GEMINI_API_KEY not configured" if api_key.blank?

        body = build_request_body(prompt, response_schema)

        uri = URI("#{API_URL}?key=#{api_key}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = 10
        http.read_timeout = 30

        request = Net::HTTP::Post.new(uri)
        request["Content-Type"] = "application/json"
        request.body = body.to_json

        response = http.request(request)

        unless response.is_a?(Net::HTTPSuccess)
          raise AI::Client::Error, "Gemini API error (#{response.code}): #{response.body}"
        end

        parsed = JSON.parse(response.body)
        text = parsed.dig("candidates", 0, "content", "parts", 0, "text")
        raise AI::Client::Error, "No content in Gemini response" if text.blank?

        JSON.parse(text)
      rescue JSON::ParserError => e
        raise AI::Client::Error, "Failed to parse Gemini response: #{e.message}"
      rescue Net::TimeoutError, Net::OpenTimeout, Errno::ECONNREFUSED => e
        raise AI::Client::Error, "Gemini API connection error: #{e.message}"
      end

      def self.build_request_body(prompt, response_schema)
        body = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        }

        if response_schema
          body[:generationConfig][:responseSchema] = response_schema
        end

        body
      end

      private_class_method :build_request_body
    end
  end
end
