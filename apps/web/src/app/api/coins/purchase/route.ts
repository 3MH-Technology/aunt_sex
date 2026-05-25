import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { coinService } from "@/services/CoinService";


export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  const { packageId } = await req.json();
  const result = await coinService.createMaxelPaySession(userId, packageId);

  if (!result.url) {
    return NextResponse.json(
      { error: "فشل إنشاء جلسة الدفع" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: result.url });
});
