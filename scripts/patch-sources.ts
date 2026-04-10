import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { getSupabaseAdminClient } from "../lib/supabase";
import type { MockOrder } from "../lib/types";

config();

async function main() {
  const filePath = path.join(process.cwd(), "mock_orders.json");
  const orders: MockOrder[] = JSON.parse(await readFile(filePath, "utf-8"));
  const supabase = getSupabaseAdminClient();

  let updated = 0;
  let skipped = 0;

  for (const [index, order] of orders.entries()) {
    const externalId = `mock-order-${String(index + 1).padStart(3, "0")}`;
    const utmSource = typeof order.customFields?.utm_source === "string"
      ? order.customFields.utm_source
      : null;

    if (!utmSource) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase
      .from("orders")
      .update({ source: utmSource })
      .eq("external_id", externalId);

    if (error) {
      console.error(`Failed to update ${externalId}: ${error.message}`);
    } else {
      updated += 1;
    }
  }

  console.log(JSON.stringify({ total: orders.length, updated, skipped }, null, 2));
}

main().catch((error) => {
  console.error(`Patch failed: ${error instanceof Error ? error.message : "Unknown"}`);
  process.exitCode = 1;
});
