# app/services/experiences/auth_service.rb
module Experiences
  class AuthService
    class TokenInvalid     < StandardError; end
    class TokenExpired     < StandardError; end
    class Unauthorized     < StandardError; end
    class NotFound         < StandardError; end

    ALGORITHM  = "HS256".freeze
    ISSUER     = "cctv".freeze
    AUDIENCE   = "experience-api".freeze
    JWT_SECRET = ENV.fetch("JWT_EXPERIENCE_SECRET", "todo-implement")

    PARTICIPANT = "participant"
    ADMIN = "admin"

    # Participant token:
    # bound to one experience via code; scope: "participant"
    def self.jwt_for_participant(experience:, user:, ttl: 7.days)
      now = Time.current.to_i

      claims = {
        sub: user.id,
        scope: PARTICIPANT,
        experience_code: experience.code,
        iat: now, # issued at
        nbf: now,
        exp: now + ttl.to_i,
        iss: ISSUER,
        aud: AUDIENCE,
        jti: SecureRandom.uuid
      }.compact

      JWT.encode(claims, JWT_SECRET, ALGORITHM)
    end

    # Admin token:
    # no experience binding; scope: "admin"
    #
    # Note, we aren't provisioning these. An admin will be logged in via a
    # session. This is for modeling how an admin jwt auth token would look.
    #
    # The experience:* is saying "this token can manage all experience actions"
    def self.jwt_for_admin(user:, ttl: 1.day, perms: ["experience:*"])
      now = Time.current.to_i
      claims = {
        sub: user.id,
        scope: ADMIN,
        perms: perms,
        iat: now, # issued at
        nbf: now,
        exp: now + ttl.to_i,
        iss: ISSUER,
        aud: AUDIENCE,
        jti: SecureRandom.uuid
      }

      JWT.encode(claims, JWT_SECRET, ALGORITHM)
    end

    # Returns a symbolized claims Hash or raises TokenInvalid/TokenExpired
    def self.decode!(token, leeway: 5)
      options = {
        algorithm: ALGORITHM,
        verify_iat: true,
        verify_expiration: true,
        leeway: leeway,
        iss: ISSUER,
        verify_iss: true,
        aud: AUDIENCE,
        verify_aud: true
      }

      payload, _header = JWT.decode(token, JWT_SECRET, true, options)

      symbolize_keys(payload)
    rescue JWT::ExpiredSignature
      raise TokenExpired, "token expired"
    rescue JWT::DecodeError => e
      raise TokenInvalid, e.message
    end

    # For participant JWTs. Verifies:
    #  - scope == "participant"
    #  - user exists
    #  - experience exists (by code)
    #  - user is a participant of that experience
    # Returns [user, experience]
    def self.authorize_participant!(claims)
      scope = claims[:scope]

      raise Unauthorized, "invalid scope" unless scope == "participant"

      user_id = claims[:sub]
      experience_code = claims[:experience_code]

      raise Unauthorized, "missing subject" if user_id.nil?
      raise Unauthorized, "missing experience_code" if experience_code.blank?

      user = ::User.find_by(id: user_id)
      raise NotFound, "user not found" if user.nil?

      experience = ::Experience.find_by(code: experience_code)
      raise NotFound, "experience not found" if experience.nil?

      participant = ::ExperienceParticipant.find_by(
        experience_id: experience.id, user_id: user.id
      )
      raise Unauthorized, "not a participant" if participant.nil?

      [user, experience]
    end

    # For admin JWTs. Verifies:
    #  - scope == "admin"
    #  - user exists and is admin/superadmin
    #
    # Returns user
    def self.admin_from_claims!(claims)
      scope = claims[:scope]
      raise Unauthorized, "invalid scope" unless scope == "admin"

      user_id = claims[:sub]
      raise Unauthorized, "missing subject" if user_id.nil?

      user = ::User.find_by(id: user_id)
      raise NotFound, "user not found" if user.nil?
      raise Unauthorized, "not an admin" unless user.admin?

      user
    end

    # Convenience: single-shot decoder that routes by scope
    # Returns one of:
    #  - [:participant, user, experience]
    #  - [:admin, user]
    def self.identify!(token)
      claims = decode!(token)
      case claims[:scope]
      when "participant"
        user, experience = authorize_participant!(claims)
        [:participant, user, experience]
      when "admin"
        user = admin_from_claims!(claims)
        [:admin, user]
      else
        raise Unauthorized, "unknown scope"
      end
    end

    def self.symbolize_keys(obj)
      case obj
      when Array
        obj.map { |e| symbolize_keys(e) }
      when Hash
        obj
          .transform_keys { |k| k.to_s.underscore.to_sym }
          .transform_values { |v| symbolize_keys(v) }
      else
        obj
      end
    end
  end
end
