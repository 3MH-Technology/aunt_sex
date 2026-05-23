import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { pointService } from "@/services/PointService";

export const POST = withAuth(async (req, { userId }) => {
  const { points, walletAddress, walletNetwork } = await req.json();
  const result = await pointService.requestConversion(
    userId,
    points,
    walletAddress,
    walletNetwork || "USDT (TRC20)"
  );
  return NextResponse.json({ success: true, conversion: result });
});
