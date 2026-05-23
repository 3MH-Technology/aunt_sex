import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { channelService } from "@/services/ChannelService";

export const PATCH = withAuth(async (req, { userId }) => {
  const { name, avatar } = await req.json();
  const channel = await channelService.updateChannel(userId, { name, avatar });
  return NextResponse.json(channel);
});
