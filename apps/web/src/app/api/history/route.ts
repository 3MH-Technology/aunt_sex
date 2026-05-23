import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withAuth, withOptionalAuth, handleError } from "@/lib/api-handler";
import { historyService } from "@/services/HistoryService";

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const history = await historyService.getUserHistory(userId, limit, cursor);
  const hasMore = history.length > limit;
  const items = hasMore ? history.slice(0, limit) : history;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ history: items, nextCursor });
});

export const POST = withOptionalAuth(async (req, { userId }) => {
  const { videoId } = await req.json();
  await historyService.trackView(userId, videoId);
  return NextResponse.json({ success: true });
});

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;
    await historyService.clearHistory(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
