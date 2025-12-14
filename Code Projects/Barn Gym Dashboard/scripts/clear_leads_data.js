#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const dotenvPath = path.resolve(__dirname, "../app/.env.local");
if (fs.existsSync(dotenvPath)) {
  const raw = fs.readFileSync(dotenvPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.substring(0, idx);
    const value = line.substring(idx + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set after loading app/.env.local");
  process.exit(1);
}

const { PrismaClient } = require(path.resolve(__dirname, "../app/src/generated/prisma"));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const tables = [
    "ManualMatchQueue",
    "Transaction",
    "Payment",
    "AdsRevenue",
    "LeadTracking",
    "LeadEvent",
    "CounterpartyMapping",
    "Lead",
  ];

  const truncateSql = `TRUNCATE TABLE ${tables
    .map((name) => `"${name}"`)
    .join(",")} RESTART IDENTITY CASCADE;`;

  console.log("Executing:", truncateSql);
  await prisma.$executeRawUnsafe(truncateSql);
  console.log("All lead/transaction data cleared.");

  const [leadCount, transactionCount] = await Promise.all([
    prisma.lead.count(),
    prisma.transaction.count(),
  ]);
  console.log("Lead count:", leadCount, "Transaction count:", transactionCount);
}

main()
  .catch((error) => {
    console.error("Clear script failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
