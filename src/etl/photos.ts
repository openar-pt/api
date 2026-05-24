import https from "node:https";
import { S3Client, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const agent = new https.Agent({ rejectUnauthorized: false });
const PLACEHOLDER_SIZE = 200;

const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT!,
  region: "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

function r2Key(id: number) {
  return `fotos/${id}`;
}

async function existsInR2(id: number): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: r2Key(id) }));
    return true;
  } catch {
    return false;
  }
}

function fetchPhoto(id: number): Promise<{ buf: Buffer; contentType: string } | null> {
  return new Promise((resolve, reject) => {
    const url = `https://app.parlamento.pt/webutils/getimage.aspx?id=${id}&type=deputado`;
    https.get(url, { agent }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        if ((res.statusCode ?? 0) >= 400 || buf.byteLength <= PLACEHOLDER_SIZE) {
          resolve(null);
        } else {
          resolve({ buf, contentType: res.headers["content-type"] ?? "image/jpeg" });
        }
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function syncOne(id: number): Promise<"uploaded" | "skipped" | "no-photo"> {
  if (await existsInR2(id)) return "skipped";
  const photo = await fetchPhoto(id);
  if (!photo) return "no-photo";
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: r2Key(id),
    Body: photo.buf,
    ContentType: photo.contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return "uploaded";
}

export async function syncPhotos(ids: number[], concurrency = 5): Promise<void> {
  if (!process.env.R2_ENDPOINT) {
    console.log("  ! R2 not configured — skipping photo sync");
    return;
  }

  const counts = { uploaded: 0, skipped: 0, noPhoto: 0 };
  const queue = [...new Set(ids)];

  async function worker() {
    let id: number | undefined;
    while ((id = queue.shift()) !== undefined) {
      const result = await syncOne(id);
      if (result === "uploaded") counts.uploaded++;
      else if (result === "skipped") counts.skipped++;
      else counts.noPhoto++;
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(
    `  ✓ photos: ${counts.uploaded} uploaded · ${counts.skipped} already in R2 · ${counts.noPhoto} no photo`
  );
}
