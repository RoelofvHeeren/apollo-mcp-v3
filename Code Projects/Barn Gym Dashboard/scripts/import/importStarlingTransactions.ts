
import path from "node:path";
import { prisma, parseCsv, findDataFile, logStep, logProgress } from "./utils";

type StarlingTransactionRow = {
  feedItemUid: string;
  transactionTime: string;
  direction: string;
  status: string;
  amountGBP: string; // "£925,00" or "£1.250,00"
  currency: string;
  source: string;
  spendingCategory: string;
  counterPartyName: string;
  reference: string;
  description: string;
};

// Helper to parse "£1.250,00" -> 125000
function parseStarlingAmount(raw: string): number {
  // Remove "£" and "." (thousands separator in this format looks like dot? or comma?)
  // Input: "£1.250,00" -> 1250.00 -> 125000
  // Input: "£925,00" -> 925.00 -> 92500

  // Check format. If it has "," as decimal separator.
  let cleaned = raw.replace(/[£\s]/g, "");

  // If it looks like European format "1.250,00"
  if (cleaned.includes(",") && cleaned.includes(".")) {
    // Swap or remove?
    // Let's assume "." is thousand and "," is decimal
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    // Just comma? "925,00" -> "925.00"
    cleaned = cleaned.replace(",", ".");
  }

  const val = parseFloat(cleaned);
  return Math.round(val * 100);
}

async function processFile(filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`\nProcessing ${fileName}...`);

  const rows = await parseCsv<StarlingTransactionRow>(filePath);
  const total = rows.length;
  let processed = 0;
  let matched = 0;
  let skipped = 0;

  for (const row of rows) {
    if (row.direction !== "IN") {
      processed++;
      skipped++;
      continue;
    }

    const txId = row.feedItemUid;

    // Parse amount
    const amountMinor = parseStarlingAmount(row.amountGBP);

    // Parse date: 2024-04-15T11:50:35.000Z
    let occurredAt = new Date(row.transactionTime);
    if (isNaN(occurredAt.getTime())) {
      occurredAt = new Date(); // Fallback
    }

    // Find contact by Name
    let contactId: string | null = null;
    // Prefer reference if it looks like a name, otherwise counterPartyName
    // References in data: "Amy Ely", "Huckstepp", "Rhoda", ""
    // CounterParty: "A Doyle", "A Huckstepp", "A J R CAMPBELL"

    // Strategy: Try both against DB
    const possibleNames = [row.reference, row.counterPartyName]
      .filter(n => n && n.trim().length > 2); // Ignore short refs like "Pt"

    for (const name of possibleNames) {
      if (!name) continue;

      // Try strict insensitive match first
      const contact = await prisma.contact.findFirst({
        where: {
          fullName: { equals: name, mode: 'insensitive' }
        },
        select: { id: true, email: true }
      });

      if (contact) {
        contactId = contact.id;
        if (contact.email) {
          const lead = await prisma.lead.findFirst({
            where: { email: { equals: contact.email, mode: 'insensitive' } },
            select: { id: true }
          });
          if (lead) leadId = lead.id;
        }
        break;
      }

      // Try "contains" for things like "A Huckstepp" matching "Huckstepp"?
      // Or "Huckstepp" matching "Alex Huckstepp"?
      // Let's try to find if the reference is a substring of a contact name
      // Only if it's a single word name?
      // This is risky for common names. Let's stick to strict first, maybe partial if confident?
      // User agreed to "Best Effort".

      const partialContact = await prisma.contact.findFirst({
        where: {
          fullName: { contains: name, mode: 'insensitive' }
        },
        select: { id: true, email: true }
      });
      if (partialContact) {
        contactId = partialContact.id;
        if (partialContact.email) {
          const lead = await prisma.lead.findFirst({
            where: { email: { equals: partialContact.email, mode: 'insensitive' } },
            select: { id: true }
          });
          if (lead) leadId = lead.id;
        }
        break;
      }
    }

    if (contactId) matched++;

    const personName = row.counterPartyName || row.reference || "Unknown Sender";
    const description = row.reference || "Starling Transfer";

    // Classify Product Type
    // STRICT MODE requested by user:
    // "For Trainerize... if there's clearly mentioned online coaching, perfect... If there's clearly mentioned PT block... then map it."
    // "If you're not certain, I rather that you don't do it at all."

    const lowerDesc = (description + " " + (row.spendingCategory || "")).toLowerCase();

    if (lowerDesc.includes("personal training")) {
      productType = "PT";
    } else if (lowerDesc.match(/\bpt\b/)) {
      // Strict word boundary check for "PT" to avoid matching "captain", "concept" etc if simple includes was used.
      // Although user said "clearly mentioned PT block", assuming "PT" as a standalone word or in context is key.
      productType = "PT";
    } else if (lowerDesc.includes("online coaching")) {
      productType = "Online Coaching";
    } else if (lowerDesc.includes("class") || lowerDesc.includes("drop-in") || lowerDesc.includes("membership")) {
      productType = "Classes";
    } else if (lowerDesc.includes("six week") || lowerDesc.includes("6 week") || lowerDesc.includes("transformation")) {
      productType = "Classes";
      tags.push("Six Week Transformation");
    } else if (lowerDesc.includes("merch") || lowerDesc.includes("hoodie") || lowerDesc.includes("shirt")) {
      productType = "Merchandise";
    }

    // Upsert transaction
    await prisma.transaction.upsert({
      where: {
        externalId_source: {
          externalId: txId,
          source: "starling"
        }
      },
      update: {
        contactId,
        leadId,
        occurredAt,
        amountMinor,
        currency: "GBP",
        description,
        status: row.status,
        personName: personName,
        updatedAt: new Date(),
        sourceFile: fileName,
        provider: "starling",
        productType,
        tags,
        confidence: "high",
      },
      create: {
        source: "starling",
        externalId: txId,
        contactId,
        leadId,
        occurredAt,
        amountMinor,
        currency: "GBP",
        description,
        status: row.status,
        personName: personName,
        sourceFile: fileName,
        provider: "starling",
        productType,
        tags,
        confidence: "high",
      }
    });

    processed++;
    logProgress(processed, total, "Transactions");
  }

  console.log(`\nFinished ${fileName}. Processed: ${total - skipped}. Matched: ${matched} (${Math.round(matched / (total - skipped || 1) * 100)}% map rate)`);
}

export async function importStarlingTransactions() {
  logStep("Importing Starling Transactions");

  const fileNames = [
    "Starling Transcations. Finalcsv.csv"
  ];

  for (const name of fileNames) {
    try {
      const filePath = await findDataFile(name);
      await processFile(filePath);
    } catch (err) {
      console.warn(`Skipping ${name}: ${(err as Error).message}`);
    }
  }
}

if (process.argv[1]?.endsWith("importStarlingTransactions.ts")) {
  importStarlingTransactions().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
