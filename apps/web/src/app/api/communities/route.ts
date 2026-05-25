import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { communityService } from "@/services/CommunityService";
import { withCoinGate } from "@/lib/coingate";
import { COINS } from "@/config/coingate";
import { CoinLedgerReason } from "@prisma/client";

export async function GET() {
  try {
    const communities = await communityService.getAll();
    return NextResponse.json(communities);
  } catch (error) {
    return handleError(error);
  }
}

export const POST = withAuth(async (req, { userId }) => {
  const { name, description, image } = await req.json();

  const { result: community } = await withCoinGate(
    userId,
    COINS.COMMUNITY_CREATE,
    CoinLedgerReason.COMMUNITY_CREATE,
    async (tx) => {
      const community = await tx.community.create({
        data: { name: name.trim(), description: description || "", image, ownerId: userId },
      });
      await tx.communityMember.create({
        data: { communityId: community.id, userId, role: "admin" },
      });
      return community;
    },
    { metadata: { name } }
  );

  return NextResponse.json(community);
});
