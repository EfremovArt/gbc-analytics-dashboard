import { NextResponse } from "next/server";

import { getDashboardData } from "../../../lib/dashboard";

export const runtime = "nodejs";

export async function GET() {
  try {
    const dashboard = await getDashboardData();
    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Dashboard request failed"
      },
      {
        status: 500
      }
    );
  }
}
