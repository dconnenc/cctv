require "net/http"
require "uri"
require "json"

module Linear
  # Minimal GraphQL client for the handful of Linear mutations feedback needs.
  # Errors raise so the enqueuing job can retry; callers are expected to check
  # Linear::Config.enabled? before constructing one.
  class Client
    class Error < StandardError; end
    class RequestFailed < Error; end

    OPEN_TIMEOUT = 5
    READ_TIMEOUT = 15

    def initialize(api_key: Config.api_key, api_url: Config.api_url)
      @api_key = api_key
      @api_url = api_url
    end

    def team_id(key)
      @team_ids ||= {}
      @team_ids[key] ||= begin
        data = query(
          <<~GRAPHQL,
            query TeamByKey($key: String!) {
              teams(filter: { key: { eq: $key } }, first: 1) {
                nodes { id key name }
              }
            }
          GRAPHQL
          { key: key },
        )

        node = data.dig("teams", "nodes")&.first
        raise Error, "Linear team with key #{key.inspect} not found" unless node

        node["id"]
      end
    end

    # Labels are resolved by name within the team and created on first use, so a
    # fresh workspace does not need manual setup before feedback starts flowing.
    def label_id(team_id, name)
      @label_ids ||= {}
      cache_key = [team_id, name]
      return @label_ids[cache_key] if @label_ids.key?(cache_key)

      data = query(
        <<~GRAPHQL,
          query LabelByName($teamId: String!, $name: String!) {
            team(id: $teamId) {
              labels(filter: { name: { eqIgnoreCase: $name } }, first: 1) {
                nodes { id name }
              }
            }
          }
        GRAPHQL
        { teamId: team_id, name: name },
      )

      existing = data.dig("team", "labels", "nodes")&.first
      @label_ids[cache_key] = existing ? existing["id"] : create_label(team_id, name)
    end

    def create_issue(team_id:, title:, description:, label_ids: [], project_id: nil)
      input = {
        teamId: team_id,
        title: title,
        description: description,
      }
      input[:labelIds] = label_ids if label_ids.present?
      input[:projectId] = project_id if project_id.present?

      data = query(
        <<~GRAPHQL,
          mutation CreateIssue($input: IssueCreateInput!) {
            issueCreate(input: $input) {
              success
              issue { id identifier url }
            }
          }
        GRAPHQL
        { input: input },
      )

      result = data["issueCreate"]
      raise RequestFailed, "issueCreate returned success=false" unless result&.dig("success")

      result["issue"]
    end

    def create_comment(issue_id:, body:)
      data = query(
        <<~GRAPHQL,
          mutation CreateComment($input: CommentCreateInput!) {
            commentCreate(input: $input) {
              success
              comment { id }
            }
          }
        GRAPHQL
        { input: { issueId: issue_id, body: body } },
      )

      result = data["commentCreate"]
      raise RequestFailed, "commentCreate returned success=false" unless result&.dig("success")

      result["comment"]
    end

    # Two-step upload: ask Linear for a signed URL, PUT the bytes there with the
    # headers it hands back, then reference the returned asset URL in markdown.
    # Returns the permanent asset URL.
    def upload_file(filename:, content_type:, io:, byte_size:)
      data = query(
        <<~GRAPHQL,
          mutation UploadFile($contentType: String!, $filename: String!, $size: Int!) {
            fileUpload(contentType: $contentType, filename: $filename, size: $size) {
              success
              uploadFile {
                uploadUrl
                assetUrl
                headers { key value }
              }
            }
          }
        GRAPHQL
        { contentType: content_type, filename: filename, size: byte_size },
      )

      upload = data.dig("fileUpload", "uploadFile")
      raise RequestFailed, "fileUpload returned no upload target" unless upload

      put_file(
        url: upload["uploadUrl"],
        content_type: content_type,
        headers: upload["headers"] || [],
        body: io.read,
      )

      upload["assetUrl"]
    end

    private

    def create_label(team_id, name)
      data = query(
        <<~GRAPHQL,
          mutation CreateLabel($input: IssueLabelCreateInput!) {
            issueLabelCreate(input: $input) {
              success
              issueLabel { id }
            }
          }
        GRAPHQL
        { input: { teamId: team_id, name: name } },
      )

      id = data.dig("issueLabelCreate", "issueLabel", "id")
      raise RequestFailed, "issueLabelCreate returned no label" unless id

      id
    end

    def query(document, variables = {})
      uri = URI.parse(@api_url)
      request = Net::HTTP::Post.new(uri)
      request["Content-Type"] = "application/json"
      request["Authorization"] = @api_key
      request.body = { query: document, variables: variables }.to_json

      response = perform(uri, request)

      unless response.is_a?(Net::HTTPSuccess)
        raise RequestFailed, "Linear responded #{response.code}: #{response.body.to_s.truncate(500)}"
      end

      body = JSON.parse(response.body)

      if body["errors"].present?
        messages = Array(body["errors"]).map { |e| e["message"] }.join("; ")
        raise RequestFailed, "Linear GraphQL error: #{messages}"
      end

      body["data"] or raise RequestFailed, "Linear returned no data"
    end

    def put_file(url:, content_type:, headers:, body:)
      uri = URI.parse(url)
      request = Net::HTTP::Put.new(uri)
      request["Content-Type"] = content_type
      request["Cache-Control"] = "public, max-age=31536000"
      headers.each { |header| request[header["key"]] = header["value"] }
      request.body = body

      response = perform(uri, request)

      unless response.is_a?(Net::HTTPSuccess)
        raise RequestFailed, "Linear asset upload responded #{response.code}"
      end

      response
    end

    def perform(uri, request)
      Net::HTTP.start(
        uri.hostname,
        uri.port,
        use_ssl: uri.scheme == "https",
        open_timeout: OPEN_TIMEOUT,
        read_timeout: READ_TIMEOUT,
      ) { |http| http.request(request) }
    end
  end
end
