import { S3StorageProvider } from "./s3-provider";
import type { StorageProvider } from "./types";

let instance: StorageProvider | null = null;

/** Single entry point the rest of the app should import — never construct a provider directly. */
export function getStorageProvider(): StorageProvider {
  if (!instance) {
    instance = new S3StorageProvider();
  }
  return instance;
}

export * from "./types";
