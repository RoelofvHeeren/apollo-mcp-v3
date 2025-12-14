
import path from "node:path";
import { prisma, parseCsv, findDataFile, logStep, logProgress, normalizeEmail } from "./utils";

type StripeTransactionRow = {
  id: string;
  "Created date (UTC)": string;
  Amount: string; // Major currency unit (e.g., 300.00)
  Currency: string;
  Description: string;
  Status: string;
  "Customer Email": string;
  "Customer Description": string;
  "Card ID": string;
};

async function processFile(filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`\nProcessing ${fileName}...`);

  const rows = await parseCsv<StripeTransactionRow>(filePath);
  const total = rows.length;
  let processed = 0;
  let matched = 0;

  for (const row of rows) {
    const txId = row.id;
    const email = normalizeEmail(row["Customer Email"]);

    if (!txId) {
      processed++;
      continue;
    }

    // Parse amounts
    const amountVal = parseFloat(row.Amount || "0");
    const amountMinor = Math.round(amountVal * 100);

    // Parse date: 2025-12-04 22:38:28
    let occurredAt = new Date(row["Created date (UTC)"]);
    if (isNaN(occurredAt.getTime())) {
      occurredAt = new Date(); // Fallback
    }

    // Find contact
    let contactId: string | null = null;
    let leadId: string | null = null;
    let personName = row["Customer Description"] || "";

    if (email) {
      const contact = await prisma.contact.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, fullName: true }
      });
      if (contact) {
        contactId = contact.id;
        matched++;
        if (!personName) personName = contact.fullName || "";
      }

      const lead = await prisma.lead.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true }
      });
      if (lead) {
        leadId = lead.id;
      }
    }

    const description = row.Description || "Stripe Payment";
    const status = row.Status === "Paid" ? "Completed" : row.Status;

    // Classify Product Type
    let productType: string | null = null;
    const lowerDesc = description.toLowerCase();
    const tags: string[] = [];

    if (lowerDesc.includes("pt") || lowerDesc.includes("personal training")) {
      productType = "PT";
    } else if (lowerDesc.includes("online") || lowerDesc.includes("coaching")) {
      productType = "Online Coaching";
    } else if (lowerDesc.includes("six week") || lowerDesc.includes("6 week") || lowerDesc.includes("transformation")) {
      productType = "Classes";
      tags.push("Six Week Transformation");
    } else if (lowerDesc.includes("class") || lowerDesc.includes("drop-in") || lowerDesc.includes("membership") || lowerDesc.includes("pack")) {
      productType = "Classes";
    } else if (lowerDesc.includes("community")) {
      productType = "Community";
    } else if (lowerDesc.includes("corporate")) {
      productType = "Corporate";
    } else if (lowerDesc.includes("merch") || lowerDesc.includes("hoodie") || lowerDesc.includes("shirt")) {
      productType = "Merchandise";
    }

    // Upsert transaction
    await prisma.transaction.upsert({
      where: {
        externalId_source: {
          externalId: txId,
          source: "stripe"
        }
      },
      update: {
        contactId,
        leadId,
        occurredAt,
        amountMinor,
        currency: row.Currency.toUpperCase(),
        description,
        status,
        personName: personName,
        updatedAt: new Date(),
        sourceFile: fileName,
        provider: "stripe",
        productType,
        tags,
        confidence: "high",
      },
      create: {
        source: "stripe",
        externalId: txId,
        contactId,
        leadId,
        occurredAt,
        amountMinor,
        currency: row.Currency.toUpperCase(),
        description,
        status,
        personName: personName,
        sourceFile: fileName,
        provider: "stripe",
        productType,
        tags,
        confidence: "high",
      }
    });

    processed++;
    logProgress(processed, total, "Transactions");
  }

  console.log(`\nFinished ${fileName}. Matched inputs: ${matched}/${total} (${Math.round(matched / total * 100)}%)`);
}

export async function importStripeTransactions() {
  logStep("Importing Stripe Transactions");

  const fileNames = [
    "Stripe Transcations All Time.csv"
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

if (process.argv[1]?.endsWith("importStripeTransactions.ts")) {
  importStripeTransactions().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
