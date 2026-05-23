import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { pointService } from "@/services/PointService";

export const GET = withAuth(async (req, { userId }) => {
  const balance = await pointService.getBalance(userId);
  return NextResponse.json(balance);
});
