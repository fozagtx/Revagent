import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function storageConfigFromEnv(env: NodeJS.ProcessEnv): StorageConfig {
  const required = ["VULTR_S3_ENDPOINT", "VULTR_S3_BUCKET", "VULTR_S3_ACCESS_KEY", "VULTR_S3_SECRET_KEY"] as const;
  for (const key of required) {
    if (!env[key]) throw new Error(`Missing env: ${key}`);
  }
  return {
    endpoint: env.VULTR_S3_ENDPOINT!,
    region: env.VULTR_S3_REGION ?? "ewr1",
    bucket: env.VULTR_S3_BUCKET!,
    accessKeyId: env.VULTR_S3_ACCESS_KEY!,
    secretAccessKey: env.VULTR_S3_SECRET_KEY!,
  };
}

export function makeS3Client(cfg: StorageConfig): S3Client {
  return new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: true,
  });
}

export type ObjectKind = "deck" | "narration" | "transcript" | "digest" | "audio";

export function buildObjectKey(kind: ObjectKind, founderId: string, ext: string): string {
  const id = randomUUID();
  const safeExt = ext.replace(/^\./, "").toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  return `${kind}/${founderId}/${date}/${id}.${safeExt}`;
}

export async function uploadBuffer(
  client: S3Client,
  cfg: StorageConfig,
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await client.send(new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return `${cfg.endpoint.replace(/\/+$/, "")}/${cfg.bucket}/${key}`;
}

export async function presignGet(
  client: S3Client,
  cfg: StorageConfig,
  key: string,
  expiresIn = 3600,
): Promise<string> {
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: cfg.bucket, Key: key }),
    { expiresIn },
  );
}

export async function presignPut(
  client: S3Client,
  cfg: StorageConfig,
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: cfg.bucket, Key: key, ContentType: contentType }),
    { expiresIn },
  );
}
