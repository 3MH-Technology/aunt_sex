import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { chatService } from "@/services/ChatService";

export async function GET() {
  try {
    const groups = await chatService.getGroups();
    return NextResponse.json(groups);
  } catch (error) {
    return handleError(error);
  }
}

export const POST = withAuth(async (req, { userId }) => {
  const { id, name, streamId } = await req.json();
  if (!id || !name) {
    return NextResponse.json({ error: "المعرف والاسم مطلوبان" }, { status: 400 });
  }

  const existing = await chatService.findGroup(id);
  if (existing) return NextResponse.json(existing);

  const group = await chatService.createGroupWithId(id, name, streamId);
  return NextResponse.json(group);
});
