import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { communityService } from "@/services/CommunityService";


export const dynamic = "force-dynamic";

export const POST = withAuth(
  async (req, { userId, params }) => {
    const communityId = (params as { id: string }).id;
    const member = await communityService.join(communityId, userId);
    return NextResponse.json(member);
  }
);

export const DELETE = withAuth(
  async (req, { userId, params }) => {
    const communityId = (params as { id: string }).id;
    await communityService.leave(communityId, userId);
    return NextResponse.json({ success: true });
  }
);
