import { NextResponse } from "next/server";
import { maintenanceService } from "@/services/MaintenanceService";
import { handleError } from "@/lib/api-handler";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const results = await maintenanceService.runAll();
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    return handleError(error);
  }
}
