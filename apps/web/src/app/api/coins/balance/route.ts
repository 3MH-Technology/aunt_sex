import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { coinService } from "@/services/CoinService";

export const GET = withAuth(async (req, { userId }) => {
  const balance = await coinService.getBalance(userId);
  return NextResponse.json(balance);
});
