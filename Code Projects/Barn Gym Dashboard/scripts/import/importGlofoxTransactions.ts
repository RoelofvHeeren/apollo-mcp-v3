
import path from "node:path";
import { prisma, parseCsv, findDataFile, logStep, logProgress, normalizeEmail } from "./utils";

type GlofoxTransactionRow = {
  Date: string;
  Time: string;
  Member: string;
  "Email address": string;
  "Sold By": string;
  Charge: string;
  Plan: string;
  Method: string;
  "Amount (GBP)": string;
  "Free Class - 100%": string;
  Status: string;
  "Transaction ID": string;
};

async function processFile(filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`\nProcessing ${fileName}...`);

  const rows = await parseCsv<GlofoxTransactionRow>(filePath);
  const total = rows.length;
  let processed = 0;
  let matched = 0;

  for (const row of rows) {
    const txId = row["Transaction ID"];
    const email = normalizeEmail(row["Email address"]);

    // Skip invalid rows or 0 amount if needed? User wanted all history so let's keep even 0 amounts potentially?
    // User said "calculate how much LTV is", implying money matters.
    // However, keeping 0 amount transactions (like free classes) is good for history.

    if (!txId) {
      processed++;
      continue;
    }

    // Parse amounts
    const amountVal = parseFloat(row["Amount (GBP)"] || "0");
    const amountMinor = Math.round(amountVal * 100);

    // Parse date: DD/MM/YYYY + HH:MM
    // 05/12/2025 00:00
    const [day, month, year] = row.Date.split("/");
    const [hour, minute] = row.Time.split(":");

    // Note: Assuming dates are valid given the source.
    let occurredAt = new Date();
    if (day && month && year) {
      // Javascript Date month is 0-indexed
      occurredAt = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour || "0"), parseInt(minute || "0")));
    }


    // Find contact
    let contactId: string | null = null;
    let leadId: string | null = null;
    let personName = row.Member;

    if (email) {
      const contact = await prisma.contact.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true }
      });
      if (contact) {
        contactId = contact.id;
        matched++;
      }

      const lead = await prisma.lead.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true }
      });
      if (lead) {
        leadId = lead.id;
      }
    }

    const description = row.Charge || row.Plan || "Glofox Transaction";
    const status = row.Status || "Completed"; // Default to completed if mapped? Glofox has "PAID", "Pending"

    // Classify Product Type
    let productType: string | null = null;
    const lowerDesc = (description + " " + (row.Plan || "")).toLowerCase();
    const tags: string[] = [];

    // Glofox Specific Logic
    if (lowerDesc.includes("six week") || lowerDesc.includes("6 week") || lowerDesc.includes("transformation")) {
      productType = "Classes";
      tags.push("Six Week Transformation");
    } else if (
      lowerDesc.includes("class") ||
      lowerDesc.includes("crdts") || // "Credits" abbr?
      lowerDesc.includes("credit") ||
      lowerDesc.includes("pack") ||
      lowerDesc.includes("membership") ||
      lowerDesc.includes("drop in") ||
      lowerDesc.includes("drop-in")
    ) {
      productType = "Classes";
    } else if (
      lowerDesc.includes("hoodie") ||
      lowerDesc.includes("t-shirt") ||
      lowerDesc.includes("bottle") ||
      lowerDesc.includes("protein") ||
      lowerDesc.includes("merch")
    ) {
      productType = "Merchandise";
    } else {
      // Fallback based on amount for single classes (~10-14 GBP)
      // "any payments like 10 bucks or like 12 bucks"
      const val = amountVal;
      if (val >= 9 && val <= 16) {
        // Reasonable range for a class drop-in
        productType = "Classes";
      }
    }

    // Upsert transaction
    // Using compound unique constraint [externalId, source]
    await prisma.transaction.upsert({
      where: {
        externalId_source: {
          externalId: txId,
          source: "glofox"
        }
      },
      update: {
        contactId,
        leadId,
        occurredAt,
        amountMinor,
        currency: "GBP",
        description,
        status,
        paymentMethod: row.Method,
        personName: personName,
        updatedAt: new Date(),
        sourceFile: fileName,
        productType,
        tags,
        provider: "glofox",
        confidence: "high",
      },
      create: {
        source: "glofox",
        externalId: txId,
        contactId,
        leadId,
        occurredAt,
        amountMinor,
        currency: "GBP",
        description,
        status,
        paymentMethod: row.Method,
        personName: personName,
        sourceFile: fileName,
        productType,
        tags,
        provider: "glofox",
        confidence: "high",
      }
    });

    processed++;
    logProgress(processed, total, "Transactions");
  }

  console.log(`\nFinished ${fileName}. Matched inputs: ${matched}/${total} (${Math.round(matched / total * 100)}%)`);
}

export async function importGlofoxTransactions() {
  logStep("Importing Glofox Transactions");

  const fileNames = [
    "Glofox Transactions 2023.csv",
    "Glofox Transcations 2024.csv", // Preserving typo from file list
    "Glofox Transactions 2025.csv"
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

if (process.argv[1]?.endsWith("importGlofoxTransactions.ts")) {
  importGlofoxTransactions().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
