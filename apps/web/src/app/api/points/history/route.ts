import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { pointService } from "@/services/PointService";


export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, { userId }) => {
  const history = await pointService.getHistory(userId);
  return NextResponse.json(history);
});
