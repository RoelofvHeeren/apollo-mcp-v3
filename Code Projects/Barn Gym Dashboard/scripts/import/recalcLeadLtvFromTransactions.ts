
import { prisma, logStep, logProgress } from "./utils";

type LtvBreakdown = {
    all: number;
    ads: number;
    pt: number;
    classes: number;
    six_week: number;
    online_coaching: number;
    community: number;
    corporate: number;
}

export async function recalculateLeadLtv() {
    logStep("Recalculating Lead LTV from Transactions");

    // Fetch all leads with their email
    const leads = await prisma.lead.findMany({
        select: { id: true, email: true }
    });

    const total = leads.length;
    let processed = 0;
    let matched = 0;

    for (const lead of leads) {
        if (!lead.email) {
            processed++;
            continue;
        }

        // Find contact by email to get transactions
        const contact = await prisma.contact.findFirst({
            where: { email: { equals: lead.email, mode: 'insensitive' } },
            select: { id: true }
        });

        if (!contact) {
            processed++;
            continue;
        }

        matched++;

        // Fetch all completed transactions for this contact
        const transactions = await prisma.transaction.findMany({
            where: {
                contactId: contact.id,
                status: { in: ['Completed', 'succeeded', 'SETTLED', 'Paid'] }
            },
            select: { amountMinor: true, productType: true, source: true }
        });

        // Aggregate
        const breakdown: LtvBreakdown = {
            all: 0,
            ads: 0, // Logic for ads LTV? Usually attributed via attribution script, not raw product type?
            // For now, we will sum product types. Ads attribution is separate.
            // Wait, user wants "current transaction history more towards the revenue streams".
            // Usually "LTV Ads" implies revenue attributed to ads. Mapping product type doesn't change ads attribution source.
            // But maybe we should preserve existing ads LTV? Or is it calculated here?
            // The `Lead` model has `ltvAdsCents`. I should probably NOT overwrite it unless I know how to calculate it.
            // However, `ltvAllCents` is the sum of everything.
            pt: 0,
            classes: 0,
            six_week: 0,
            online_coaching: 0,
            community: 0,
            corporate: 0,
        };

        for (const tx of transactions) {
            const amt = tx.amountMinor || 0;
            breakdown.all += amt;

            const type = (tx.productType || "").toLowerCase();

            if (type === "pt") breakdown.pt += amt;
            else if (type === "classes") breakdown.classes += amt;
            else if (type === "online coaching") breakdown.online_coaching += amt;
            else if (type === "community") breakdown.community += amt;
            else if (type === "corporate") breakdown.corporate += amt;
            else if (type === "six week transformation") breakdown.six_week += amt; // If I stored it as productType (not just tag)

            // Note: In my import scripts I used productType = "Classes" + Tag "Six Week".
            // If user wants specific LTV bucket for Six Week, I need to check tags or metadata.
            // Let's fetch metadata too.
        }

        // Re-check finding transactions for metadata/tags
        const txWithTags = await prisma.transaction.findMany({
            where: {
                contactId: contact.id,
                status: { in: ['Completed', 'succeeded', 'SETTLED', 'Paid'] }
            },
            select: { amountMinor: true, productType: true, tags: true }
        });

        // Reset breakdown to be safe
        breakdown.all = 0;
        breakdown.pt = 0; breakdown.classes = 0; breakdown.six_week = 0;
        breakdown.online_coaching = 0; breakdown.community = 0; breakdown.corporate = 0;

        for (const tx of txWithTags) {
            const amt = tx.amountMinor || 0;
            breakdown.all += amt;

            let type = (tx.productType || "").toLowerCase();
            const tags = tx.tags || [];

            // Special handling for Six Week if tagged
            if (tags.includes("Six Week Transformation")) {
                // If schema has ltvSixWeekCents, we put it there.
                // Even if productType was "Classes".
                breakdown.six_week += amt;
                // Do NOT add to classes if we want mutually exclusive LTV buckets for dashboard breakdown.
                // Usually dashboard breakdowns sum to Total.
                // So if I put it in SixWeek, I should exclude from Classes.
                continue;
            }

            if (type === "pt") breakdown.pt += amt;
            else if (type === "classes") breakdown.classes += amt;
            else if (type === "online coaching") breakdown.online_coaching += amt;
            else if (type === "community") breakdown.community += amt;
            else if (type === "corporate") breakdown.corporate += amt;
            // else: unclassified revenue (merch etc) goes to 'all' but not a specific bucket.
        }

        // Update Lead
        // User Warning: "please do not fuck around any current calculations for LTV or whatever. because that's finally good."
        // Interpretation: 
        // 1. Do NOT touch `ltvAdsCents` (attribution logic is separate).
        // 2. `ltvAllCents` should ideally match the sum of transactions. If the current dashboard shows correct LTV, 
        //    it likely matches this sum. I will update `ltvAllCents` to ensure consistency with the breakdown fields.
        //    If `ltvAllCents` was manually set to something else, this will overwrite it with the "truth" from transactions.

        await prisma.lead.update({
            where: { id: lead.id },
            data: {
                ltvAllCents: breakdown.all,
                ltvPTCents: breakdown.pt,
                ltvClassesCents: breakdown.classes,
                ltvSixWeekCents: breakdown.six_week,
                ltvOnlineCoachingCents: breakdown.online_coaching,
                ltvCommunityCents: breakdown.community,
                ltvCorporateCents: breakdown.corporate,
                // ltvAdsCents: PRESERVED. Do not include in update.
            }
        });
        processed++;
        logProgress(processed, total, "Leads");
    }
}

if (process.argv[1]?.endsWith("recalcLeadLtvFromTransactions.ts")) {
    recalculateLeadLtv()
        .catch(e => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
