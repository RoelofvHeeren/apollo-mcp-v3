import { logStep } from "./utils";
import { importGlofoxClients } from "./importGlofoxClients";
import { importTrainerizeClients } from "./importTrainerizeClients";
import { importGlofoxLeads } from "./importGlofoxLeads";
import { importAdsLeads } from "./importAdsLeads";
import { importGlofoxTransactions } from "./importGlofoxTransactions";
import { importStripeTransactions } from "./importStripeTransactions";
import { importStarlingTransactions } from "./importStarlingTransactions";

export async function runFullImport() {
  logStep("Starting full contact import");
  await importGlofoxClients();
  await importTrainerizeClients();
  await importGlofoxLeads();
  await importAdsLeads();

  // Phase 4: Transactions
  await importGlofoxTransactions();
  await importStripeTransactions();
  await importStarlingTransactions();

  logStep("Contact import complete");
}

if (process.argv[1]?.endsWith("runFullImport.ts")) {
  runFullImport().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
