import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider } from "./types";

/**
 * S3-compatible storage provider. Backs local dev with the MinIO container in
 * docker-compose.yml; the same code path works unmodified against AWS S3 or
 * Cloudflare R2 in production by swapping env vars only. Vercel Blob has its
 * own SDK rather than an S3-compatible endpoint — swap this file's internals
 * (not its call sites) if Blob is chosen for production storage.
 */
export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor() {
    const {
      STORAGE_ENDPOINT,
      STORAGE_REGION,
      STORAGE_ACCESS_KEY_ID,
      STORAGE_SECRET_ACCESS_KEY,
      STORAGE_BUCKET,
      STORAGE_PUBLIC_BASE_URL,
      STORAGE_FORCE_PATH_STYLE,
    } = process.env;

    if (
      !STORAGE_ENDPOINT ||
      !STORAGE_ACCESS_KEY_ID ||
      !STORAGE_SECRET_ACCESS_KEY ||
      !STORAGE_BUCKET
    ) {
      throw new Error(
        "Storage is not configured. Set STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY, STORAGE_BUCKET.",
      );
    }

    this.bucket = STORAGE_BUCKET;
    this.publicBaseUrl = STORAGE_PUBLIC_BASE_URL ?? `${STORAGE_ENDPOINT}/${STORAGE_BUCKET}`;

    this.client = new S3Client({
      endpoint: STORAGE_ENDPOINT,
      region: STORAGE_REGION ?? "us-east-1",
      forcePathStyle: STORAGE_FORCE_PATH_STYLE !== "false",
      credentials: {
        accessKeyId: STORAGE_ACCESS_KEY_ID,
        secretAccessKey: STORAGE_SECRET_ACCESS_KEY,
      },
    });
  }

  async upload({
    key,
    body,
    contentType,
  }: {
    key: string;
    body: Buffer | Uint8Array;
    contentType: string;
  }) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return { key, url: this.getPublicUrl(key) };
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  async getSignedUploadUrl({
    key,
    contentType,
    expiresInSeconds = 900,
  }: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
