import { Queue } from "bullmq";
import { redis } from "./redis";

export const videoProcessingQueue = new Queue("video-processing", {
  connection: redis,
});

export async function addVideoToQueue(videoId: string, inputPath: string, userId: string, coinDeductionKey: string) {
  await videoProcessingQueue.add("process-video", { videoId, inputPath, userId, coinDeductionKey }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}
