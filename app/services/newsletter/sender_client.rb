module Newsletter
  # Thin wrapper around the Sender REST API (https://api.sender.net). Adds a
  # subscriber to the configured mailing list group. Mirrors the outbound-call
  # shape used by AI::Providers::Gemini.
  class SenderClient
    class Error < StandardError; end

    API_URL = "https://api.sender.net/v2/subscribers".freeze

    def self.subscribe(email:, firstname: nil, lastname: nil)
      api_token = ENV["SENDER_API_TOKEN"]
      group_id  = ENV["SENDER_MAIN_GROUP_ID"]
      raise Error, "SENDER_API_TOKEN not configured"     if api_token.blank?
      raise Error, "SENDER_MAIN_GROUP_ID not configured" if group_id.blank?
      raise Error, "email is required"                    if email.blank?

      uri  = URI(API_URL)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl      = true
      http.open_timeout = 10
      http.read_timeout = 30

      request = Net::HTTP::Post.new(uri)
      request["Authorization"] = "Bearer #{api_token}"
      request["Content-Type"]  = "application/json"
      request["Accept"]        = "application/json"
      request.body = {
        email: email,
        firstname: firstname.presence,
        lastname: lastname.presence,
        groups: [group_id]
      }.compact.to_json

      response = http.request(request)

      unless response.is_a?(Net::HTTPSuccess)
        raise Error, "Sender API error (#{response.code}): #{response.body}"
      end

      true
    rescue Net::OpenTimeout, Net::ReadTimeout, Net::WriteTimeout, Timeout::Error,
           SocketError, OpenSSL::SSL::SSLError, IOError,
           Errno::ECONNREFUSED, Errno::ECONNRESET, Errno::ETIMEDOUT, Errno::EPIPE => e
      raise Error, "Sender API connection error (#{e.class}): #{e.message}"
    end
  end
end
