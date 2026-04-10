import { NextResponse } from "next/server";

import {
  getHighValueThreshold,
  isRetailCrmConfigured,
  isSupabaseConfigured,
  isTelegramConfigured
} from "../../../lib/env";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    success: true,
    services: {
      retailcrm: isRetailCrmConfigured(),
      supabase: isSupabaseConfigured(),
      telegram: isTelegramConfigured()
    },
    highValueThreshold: getHighValueThreshold()
  });
}
