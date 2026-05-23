import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { chatService } from "@/services/ChatService";

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId") || "general";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const messages = await chatService.getMessages(groupId, limit);
  return NextResponse.json(messages.reverse());
});

export const POST = withAuth(async (req, { userId }) => {
  const { text, groupId } = await req.json();
  const message = await chatService.sendMessage(userId, groupId || "general", text);
  return NextResponse.json(message);
});
