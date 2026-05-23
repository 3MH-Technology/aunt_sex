import { Queue } from "bullmq";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

export const videoQueue = new Queue("video-processing", {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
  },
});
