import { config } from "dotenv";

import { syncRetailCrmToSupabase } from "../lib/sync";

config();

async function main() {
  const result = await syncRetailCrmToSupabase();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Sync failed: ${message}`);
  process.exitCode = 1;
});
