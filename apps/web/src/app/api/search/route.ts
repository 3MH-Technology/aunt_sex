import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleError, withRateLimit } from "@/lib/api-handler";
import { cache } from "@/lib/cache";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const searchHandler = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (q.length === 0) {
      return NextResponse.json({ videos: [], total: 0 });
    }

    if (q.length < 2) {
      return NextResponse.json(
        { error: "يجب أن يكون البحث حرفين على الأقل" },
        { status: 400 }
      );
    }

    const cacheKey = `search:${q.toLowerCase()}:${page}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached));

    const [videos, total] = await Promise.all([
      db.video.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
          ],
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { views: "desc" },
        include: {
          channel: { select: { id: true, name: true, avatar: true } },
        },
      }),
      db.video.count({
        where: {
          OR: [{ title: { contains: q, mode: "insensitive" } }],
        },
      }),
    ]);

    const result = { videos, total, page, limit };
    await cache.set(cacheKey, JSON.stringify(result), 30);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Search failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
};

export const GET = withRateLimit(searchHandler, { max: 20, windowMs: 60000 });
