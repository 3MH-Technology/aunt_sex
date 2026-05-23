import { NextResponse } from "next/server";
import { withAuth, handleError } from "@/lib/api-handler";
import { userService } from "@/services/UserService";
import { ValidationError } from "@/lib/errors";

export const POST = withAuth(async (req, { userId }) => {
  const { labels } = await req.json();
  if (!Array.isArray(labels)) {
    throw new ValidationError("labels يجب أن يكون مصفوفة");
  }
  const result = await userService.updateLabels(userId, labels);
  return NextResponse.json(result);
});
