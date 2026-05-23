import { NextResponse } from "next/server";
import { handleError } from "@/lib/api-handler";
import { communityService } from "@/services/CommunityService";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const community = await communityService.getById(params.id);
    return NextResponse.json(community);
  } catch (error) {
    return handleError(error);
  }
}
