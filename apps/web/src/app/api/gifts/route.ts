import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { giftService } from "@/services/GiftService";


export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const types = await giftService.getGiftTypes();
    return NextResponse.json(types);
  } catch (error) {
    return handleError(error);
  }
}

export const POST = withAuth(async (req, { userId }) => {
  const { receiverId, giftTypeId, streamId } = await req.json();
  const result = await giftService.sendGift(userId, { receiverId, giftTypeId, streamId });
  return NextResponse.json({ success: true, id: result.id });
});
