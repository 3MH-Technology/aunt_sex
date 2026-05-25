import { NextResponse } from "next/server";
import { handleError } from "@/lib/api-handler";
import { userService } from "@/services/UserService";


export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await userService.getUser(params.id);
    return NextResponse.json(user);
  } catch (error) {
    return handleError(error);
  }
}
