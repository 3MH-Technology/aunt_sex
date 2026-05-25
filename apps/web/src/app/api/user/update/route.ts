import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { userService } from "@/services/UserService";


export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  const { name, username, phone, dateOfBirth, gender, bio } = await req.json();
  const user = await userService.updateProfile(userId, { name, bio, phone, dateOfBirth, gender });
  return NextResponse.json({ success: true, user });
});
