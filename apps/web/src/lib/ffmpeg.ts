import { Queue } from "bullmq";
import { redis } from "./redis";

function createQueue() {
  if (!redis) return null;
  return new Queue("video-processing", { connection: redis });
}

export const videoProcessingQueue = createQueue();

export async function addVideoToQueue(videoId: string, inputPath: string, userId: string, coinDeductionKey: string) {
  if (!videoProcessingQueue) return;
  await videoProcessingQueue.add("process-video", { videoId, inputPath, userId, coinDeductionKey }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}
