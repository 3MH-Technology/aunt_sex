import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { paymentService } from "@/services/PaymentService";


export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  const { plan, gateway = "maxelpay" } = await req.json();

  let result: { url: string | null };

  if (gateway === "stripe") {
    result = await paymentService.createStripeCheckout(userId, plan);
  } else {
    result = await paymentService.createMaxelPaySession(userId, plan);
  }

  if (!result.url) {
    return NextResponse.json(
      { error: "فشل إنشاء جلسة الدفع" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: result.url });
});
