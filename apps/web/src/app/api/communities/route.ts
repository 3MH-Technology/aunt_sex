import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { communityService } from "@/services/CommunityService";

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
  const community = await communityService.create(userId, { name, description, image });
  return NextResponse.json(community);
});
