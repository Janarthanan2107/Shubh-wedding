import fs from "fs/promises";
import path from "path";

export interface StoredFile {
  url: string;
  key: string;
}

export interface FileStore {
  put(key: string, body: Buffer, contentType: string): Promise<StoredFile>;
  read(key: string): Promise<{ body: Buffer; contentType: string } | null>;
}

const ROOT = path.join(process.cwd(), "data", "uploads");

export class LocalDiskStore implements FileStore {
  async put(key: string, body: Buffer): Promise<StoredFile> {
    const safe = key.replace(/[^a-zA-Z0-9._-]/g, "");
    await fs.mkdir(ROOT, { recursive: true });
    await fs.writeFile(path.join(ROOT, safe), body);
    return { key: safe, url: `/api/media/${safe}` };
  }

  async read(key: string) {
    const safe = key.replace(/[^a-zA-Z0-9._-]/g, "");
    try {
      const body = await fs.readFile(path.join(ROOT, safe));
      return { body, contentType: "image/webp" };
    } catch {
      return null;
    }
  }
}

/** Cloudflare R2 / S3-compatible adapter. Used when S3_* env vars are set. */
export class S3CompatibleStore implements FileStore {
  constructor(
    private cfg: {
      endpoint: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
      publicBaseUrl: string;
    },
  ) {}

  async put(key: string, body: Buffer, contentType: string): Promise<StoredFile> {
    void key;
    void body;
    void contentType;
    void this.cfg;
    throw new Error(
      "S3-compatible adapter is stubbed. Unset S3_* to keep using the local disk store, which is the default for this prototype.",
    );
  }

  async read(): Promise<null> {
    return null;
  }
}

export function createFileStore(): FileStore {
  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (bucket && endpoint && accessKeyId && secretAccessKey) {
    return new S3CompatibleStore({
      endpoint,
      bucket,
      accessKeyId,
      secretAccessKey,
      publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || `${endpoint}/${bucket}`,
    });
  }
  return new LocalDiskStore();
}

export function sniffImage(buf: Buffer): "jpeg" | "png" | "webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  return null;
}
