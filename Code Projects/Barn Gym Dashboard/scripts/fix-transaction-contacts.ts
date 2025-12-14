
import { prisma, logStep, logProgress } from "./import/utils";

export async function fixTransactionContacts() {
    logStep("Fixing Transaction Contact Links");

    // Fetch transactions with NO contactId but WITH leadId
    const transactions = await prisma.transaction.findMany({
        where: {
            contactId: null,
            leadId: { not: null }
        },
        include: {
            lead: {
                select: { email: true }
            }
        }
    });

    const total = transactions.length;
    console.log(`Found ${total} transactions with Lead but no Contact.`);
    let processed = 0;
    let updated = 0;

    for (const tx of transactions) {
        if (!tx.lead?.email) {
            processed++;
            continue;
        }

        const email = tx.lead.email.trim();

        // Find contact by email
        const contact = await prisma.contact.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            select: { id: true }
        });

        if (contact) {
            await prisma.transaction.update({
                where: { id: tx.id },
                data: { contactId: contact.id }
            });
            updated++;
        }

        processed++;
        if (processed % 100 === 0) logProgress(processed, total, "Transactions Checked");
    }

    console.log(`\nLinked ${updated} transactions to Contacts.`);
}

if (process.argv[1]?.endsWith("fix-transaction-contacts.ts")) {
    fixTransactionContacts()
        .catch(e => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
