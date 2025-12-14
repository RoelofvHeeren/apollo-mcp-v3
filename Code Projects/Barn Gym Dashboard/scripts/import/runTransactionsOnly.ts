
import { logStep } from "./utils";
import { importGlofoxTransactions } from "./importGlofoxTransactions";
import { importStripeTransactions } from "./importStripeTransactions";
import { importStarlingTransactions } from "./importStarlingTransactions";


export async function runTransactionsOnly() {
    logStep("Starting TRANSACTION-ONLY import");

    // Phase 4: Transactions
    await importGlofoxTransactions();
    await importStripeTransactions();
    await importStarlingTransactions();

    logStep("Transaction import complete");
}

if (process.argv[1]?.endsWith("runTransactionsOnly.ts")) {
    runTransactionsOnly().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
