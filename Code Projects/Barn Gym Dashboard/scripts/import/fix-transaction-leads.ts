
import { prisma, logStep, logProgress } from "./utils";

export async function fixTransactionLeads() {
    logStep("Fixing Transaction Lead Links");

    // Fetch all transactions with contactId but NO leadId
    const transactions = await prisma.transaction.findMany({
        where: {
            contactId: { not: null },
            leadId: null
        },
        include: {
            contact: {
                select: { email: true }
            }
        }
    });

    const total = transactions.length;
    console.log(`Found ${total} transactions to check.`);
    let processed = 0;
    let updated = 0;

    // Cache email -> leadId to avoid repeated lookups
    const emailToLeadId = new Map<string, string>();

    for (const tx of transactions) {
        if (!tx.contact?.email) {
            processed++;
            continue;
        }

        const email = tx.contact.email.toLowerCase();
        let leadId = emailToLeadId.get(email);

        if (!leadId) {
            // Find lead by email
            const lead = await prisma.lead.findFirst({
                where: { email: { equals: email, mode: 'insensitive' } },
                select: { id: true }
            });

            if (lead) {
                leadId = lead.id;
                emailToLeadId.set(email, leadId);
            } else {
                // Mark as not found to save lookup time? 
                // Or just null. Map stores string, so let's store "NULL" or something.
                // Actually, if distinct emails are low, finding is fast.
            }
        }

        if (leadId) {
            await prisma.transaction.update({
                where: { id: tx.id },
                data: { leadId }
            });
            updated++;
        }

        processed++;
        if (processed % 100 === 0) logProgress(processed, total, "Transactions Checked");
    }

    console.log(`\nFixed ${updated} transactions.`);
}

if (process.argv[1]?.endsWith("fix-transaction-leads.ts")) {
    fixTransactionLeads()
        .catch(e => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
