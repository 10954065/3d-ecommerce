export interface StorageProvider {
  /** Uploads a buffer and returns the storage key it was saved under. */
  upload(params: {
    key: string;
    body: Buffer | Uint8Array;
    contentType: string;
  }): Promise<{ key: string; url: string }>;

  /** Public URL a browser can fetch the asset from (CDN-fronted in production). */
  getPublicUrl(key: string): string;

  /** Pre-signed PUT URL so the admin UI can upload large 3D assets directly, bypassing the app server. */
  getSignedUploadUrl(params: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<string>;

  delete(key: string): Promise<void>;
}

/**
 * Approved upload types per the 3D asset security rules: only these MIME types
 * are ever accepted for garment/mannequin assets, product media, or fabric maps.
 */
export const ALLOWED_ASSET_MIME_TYPES = {
  model: ["model/gltf-binary", "model/gltf+json"],
  image: ["image/png", "image/jpeg", "image/webp", "image/ktx2"],
} as const;

export const MAX_ASSET_SIZE_BYTES = {
  model: 100 * 1024 * 1024, // 100MB — garment/mannequin GLB
  image: 15 * 1024 * 1024, // 15MB — textures, product photos
} as const;
