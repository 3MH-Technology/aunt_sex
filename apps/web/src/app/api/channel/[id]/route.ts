import { NextResponse } from "next/server";
import { handleError } from "@/lib/api-handler";
import { channelService } from "@/services/ChannelService";


export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const channel = await channelService.getChannel(params.id);
    return NextResponse.json(channel);
  } catch (error) {
    return handleError(error);
  }
}
