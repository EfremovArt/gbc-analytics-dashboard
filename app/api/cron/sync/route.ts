import { NextRequest, NextResponse } from "next/server";

import { isRetailCrmConfigured, isSupabaseConfigured } from "../../../../lib/env";
import { syncRetailCrmToSupabase } from "../../../../lib/sync";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  if (!isRetailCrmConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "RetailCRM or Supabase environment variables are missing"
      },
      {
        status: 500
      }
    );
  }

  try {
    const result = await syncRetailCrmToSupabase();

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed"
      },
      {
        status: 500
      }
    );
  }
}
