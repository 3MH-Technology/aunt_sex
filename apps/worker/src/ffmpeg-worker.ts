import { Worker } from "bullmq";
import { spawn } from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { existsSync, mkdirSync, readFileSync, unlinkSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error("FATAL: AWS credentials (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) are required");
  process.exit(1);
}

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const db = new PrismaClient();
const BUCKET = process.env.S3_BUCKET || "auntsex-videos";
const CDN_URL = process.env.CDN_URL || `https://${BUCKET}.s3.amazonaws.com`;

const QUALITIES = [
  { label: "360p", bitrate: "800k", scale: "640:360" },
  { label: "720p", bitrate: "2500k", scale: "1280:720" },
  { label: "1080p", bitrate: "5000k", scale: "1920:1080" },
] as const;

function validateUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

async function transcodeQuality(
  inputPath: string,
  videoId: string,
  quality: typeof QUALITIES[number]
): Promise<string> {
  const tmpBase = join(tmpdir(), "owntube");
  if (!existsSync(tmpBase)) mkdirSync(tmpBase, { recursive: true });
  const outDir = mkdtempSync(join(tmpBase, `${videoId}_${quality.label}_`));
  const outPath = join(outDir, "index.m3u8");

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-i", inputPath,
      "-vf", `scale=${quality.scale}`,
      "-c:v", "libx264",
      "-b:v", quality.bitrate,
      "-c:a", "aac",
      "-b:a", "128k",
      "-hls_time", "6",
      "-hls_list_size", "0",
      "-hls_segment_filename", join(outDir, "segment_%03d.ts"),
      "-f", "hls",
      outPath,
    ], { stdio: ["ignore", "pipe", "pipe"] });

    let stderr = "";
    proc.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited code ${code}: ${stderr.slice(-500)}`));
    });
    proc.on("error", reject);
  });

  const fileContent = readFileSync(outPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `videos/${videoId}/${quality.label}/index.m3u8`,
      Body: fileContent,
      ContentType: "application/vnd.apple.mpegurl",
    })
  );

  return `${CDN_URL}/videos/${videoId}/${quality.label}/index.m3u8`;
}

const worker = new Worker(
  "video-processing",
  async (job) => {
    const { videoId, inputPath } = job.data;

    if (!videoId || !inputPath) {
      throw new Error("Invalid job data: videoId and inputPath required");
    }

    if (!validateUUID(videoId)) {
      throw new Error(`Invalid videoId format: ${videoId}`);
    }

    const resolvedPath = join(inputPath);
    if (!resolvedPath.startsWith("/app/public/uploads/")) {
      throw new Error(`Access denied: inputPath must be under /app/public/uploads/`);
    }

    if (!existsSync(resolvedPath)) {
      throw new Error(`Input file not found: ${resolvedPath}`);
    }

    const outputs: Record<string, string> = {};

    for (const quality of QUALITIES) {
      try {
        const url = await transcodeQuality(resolvedPath, videoId, quality);
        outputs[quality.label] = url;
      } catch (err) {
        console.error(`Failed to transcode ${quality.label} for video ${videoId}:`, err);
      }
    }

    if (Object.keys(outputs).length === 0) {
      throw new Error("All transcoding qualities failed");
    }

    await db.video.update({
      where: { id: videoId },
      data: {
        qualities: JSON.stringify(outputs),
        hlsUrl: outputs["720p"] || outputs["360p"] || Object.values(outputs)[0],
      },
    });

    try {
      unlinkSync(resolvedPath);
    } catch {}

    console.log(`Video ${videoId} processed successfully:`, outputs);
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
    },
    concurrency: 2,
  }
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});
