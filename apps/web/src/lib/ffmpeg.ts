import { Queue } from "bullmq";
import { redis } from "./redis";

export const videoProcessingQueue = new Queue("video-processing", {
  connection: redis,
});

export async function addVideoToQueue(videoId: string, inputPath: string) {
  await videoProcessingQueue.add("process-video", { videoId, inputPath }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}
