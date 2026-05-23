import { NextResponse } from "next/server";
import { handleError } from "@/lib/api-handler";
import { liveStreamService } from "@/services/LiveStreamService";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const stream = await liveStreamService.getStream(params.id);
    return NextResponse.json(stream);
  } catch (error) {
    return handleError(error);
  }
}
