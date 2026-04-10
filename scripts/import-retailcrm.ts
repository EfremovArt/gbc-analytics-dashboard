import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createRetailCrmOrder } from "../lib/retailcrm";
import type { MockOrder } from "../lib/types";

config();

async function loadMockOrders(): Promise<MockOrder[]> {
  const filePath = path.join(process.cwd(), "mock_orders.json");
  const fileContents = await readFile(filePath, "utf-8");
  return JSON.parse(fileContents) as MockOrder[];
}

async function main() {
  const orders = await loadMockOrders();
  let created = 0;
  let failed = 0;

  for (const [index, order] of orders.entries()) {
    const externalId = `mock-order-${String(index + 1).padStart(3, "0")}`;

    try {
      await createRetailCrmOrder(order, externalId);
      created += 1;
      console.log(`Created order ${index + 1}/${orders.length} with externalId=${externalId}`);
    } catch (error) {
      failed += 1;
      const reason = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to create order ${externalId}: ${reason}`);
    }
  }

  console.log(JSON.stringify({ total: orders.length, created, failed }, null, 2));

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Import failed: ${message}`);
  process.exitCode = 1;
});
