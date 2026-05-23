import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { VideoService } from "@/services/VideoService";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const videoService = new VideoService();

describe("VideoService Integration", () => {
  beforeAll(async () => {
    await db.$connect();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("should return paginated videos", async () => {
    const videos = await videoService.findMany({ page: 1, limit: 5 });
    expect(Array.isArray(videos)).toBe(true);
    expect(videos.length).toBeLessThanOrEqual(5);
  });

  it("should reject excessive limit", async () => {
    const videos = await videoService.findMany({ page: 1, limit: 1000 });
    expect(videos.length).toBeLessThanOrEqual(50);
  });
});
