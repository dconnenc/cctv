declare module '@rails/activestorage' {
  interface Blob {
    signed_id: string;
    filename: string;
    content_type: string;
    byte_size: number;
    checksum: string;
  }

  interface DirectUploadDelegate {
    directUploadWillCreateBlobWithXHR?(xhr: XMLHttpRequest): void;
    directUploadWillStoreFileWithXHR?(xhr: XMLHttpRequest): void;
  }

  class DirectUpload {
    constructor(file: File, url: string, delegate?: DirectUploadDelegate);
    create(callback: (error: Error, blob: Blob) => void): void;
  }
}
