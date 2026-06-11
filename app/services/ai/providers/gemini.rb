module AI
  module Providers
    class Gemini
      DEFAULT_MODEL = "gemini-2.5-flash".freeze
      API_BASE = "https://generativelanguage.googleapis.com/v1beta/models".freeze

      def self.call(prompt:, response_schema: nil, model: nil, temperature: 0)
        api_key = ENV["GEMINI_API_KEY"]
        raise AI::Client::Error, "GEMINI_API_KEY not configured" if api_key.blank?

        model ||= DEFAULT_MODEL
        body = build_request_body(prompt, response_schema, temperature)

        uri = URI("#{API_BASE}/#{model}:generateContent?key=#{api_key}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = 28
        http.read_timeout = 28

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
      rescue Net::OpenTimeout, Net::ReadTimeout, Net::WriteTimeout, Timeout::Error,
             SocketError, OpenSSL::SSL::SSLError, IOError,
             Errno::ECONNREFUSED, Errno::ECONNRESET, Errno::ETIMEDOUT, Errno::EPIPE => e
        raise AI::Client::Error, "Gemini API connection error (#{e.class}): #{e.message}"
      end

      def self.build_request_body(prompt, response_schema, temperature)
        body = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: temperature
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
