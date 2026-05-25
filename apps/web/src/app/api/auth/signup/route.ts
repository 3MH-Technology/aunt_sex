import { NextResponse } from "next/server";
import { authService } from "@/services/AuthService";
import { rateLimit } from "@/lib/rate-limit";
import { ValidationError } from "@/lib/errors";


export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`signup:${ip}`, { windowMs: 60 * 1000, max: 3 });
  if (rl.limited) {
    return NextResponse.json(
      { error: "طلبات كثيرة جداً. حاول مرة أخرى بعد دقيقة." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const { email, password, name, username, phone, dateOfBirth, bio, gender } = body;
  if (!email || !password || !name || !username) {
    return NextResponse.json(
      { error: "البريد الإلكتروني وكلمة المرور والاسم واسم المستخدم مطلوبون" },
      { status: 422 }
    );
  }

  try {
    const user = await authService.signup({
      email, password, name, username, phone, dateOfBirth, bio, gender,
    });
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
