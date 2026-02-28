class ActiveStorageUrlService
  def self.blob_url(blob)
    return nil unless blob

    "/rails/active_storage/blobs/redirect/#{blob.signed_id}/#{blob.filename}"
  end
end
