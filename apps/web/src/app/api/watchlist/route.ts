import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { watchlistService } from "@/services/WatchlistService";


export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, { userId }) => {
  const items = await watchlistService.getUserWatchlist(userId);
  return NextResponse.json(items);
});

export const POST = withAuth(async (req, { userId }) => {
  const { videoId } = await req.json();
  const result = await watchlistService.toggleWatchlist(userId, videoId);
  return NextResponse.json(result);
});
