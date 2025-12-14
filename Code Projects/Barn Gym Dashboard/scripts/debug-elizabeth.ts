import { prisma } from './import/utils';
import "dotenv/config";

async function inspectElizabeth() {
    const email = "lizzie71@me.com";
    console.log(`Inspecting data for ${email}...`);

    // 1. Find Leads
    const leads = await prisma.lead.findMany({
        where: { email: { equals: email, mode: 'insensitive' } },
        include: { transactions: true }
    });
    console.log(`\nFound ${leads.length} Leads:`);
    leads.forEach(l => {
        // Lead has fullName, firstName, lastName.
        const name = l.fullName || `${l.firstName || ''} ${l.lastName || ''}`.trim();
        console.log(`- Lead ID: ${l.id}, Name: ${name}, LTV: ${l.ltvAllCents}, Tx Count: ${l.transactions.length}`);
    });

    // 2. Find Contacts
    const contacts = await prisma.contact.findMany({
        where: { email: { equals: email, mode: 'insensitive' } },
        include: { transactions: true }
    });
    console.log(`\nFound ${contacts.length} Contacts:`);
    contacts.forEach(c => {
        // Contact has fullName.
        console.log(`- Contact ID: ${c.id}, Name: ${c.fullName}, Tx Count: ${c.transactions.length}`);
    });

    // 3. Find Transactions by raw email match (if stored in metadata/description) or just generic search if possible? 
    // Actually, let's look for transactions that MIGHT belong to her but are unlinked.
    // Glofox transactions usually have personName?
    const name = "Elizabeth Taylor";
    const looseTransactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { personName: { contains: name, mode: 'insensitive' } },
                { description: { contains: name, mode: 'insensitive' } },
                { leadId: { in: leads.map(l => l.id) } } // Also include linked tx
            ]
        },
        take: 20
    });

    console.log(`\nFound ${looseTransactions.length} potential transactions by name "${name}" or Linked Lead:`);
    looseTransactions.forEach(tx => {
        console.log(`- Tx ID: ${tx.id}, Amount: ${tx.amountMinor}, Status: '${tx.status}', ContactID: ${tx.contactId}, LeadID: ${tx.leadId}, Date: ${tx.occurredAt}`);
    });
}

inspectElizabeth()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
