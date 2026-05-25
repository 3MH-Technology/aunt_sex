import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";


export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

export async function GET(req: Request, context: any) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = await rateLimit(`auth:${ip}`, { windowMs: 60000, max: 10 });
  if (rl.limited) {
    return new Response("طلبات كثيرة جداً", { status: 429 });
  }
  return handler(req, context);
}

export async function POST(req: Request, context: any) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = await rateLimit(`auth:${ip}`, { windowMs: 60000, max: 5 });
  if (rl.limited) {
    return new Response("طلبات كثيرة جداً. حاول بعد دقيقة.", { status: 429 });
  }
  return handler(req, context);
}
