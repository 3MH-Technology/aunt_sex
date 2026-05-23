import { NextResponse } from "next/server";
import { handleError } from "@/lib/api-handler";
import { coinService } from "@/services/CoinService";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const packages = await coinService.getPackages();
    return NextResponse.json(packages);
  } catch (error) {
    return handleError(error);
  }
}
