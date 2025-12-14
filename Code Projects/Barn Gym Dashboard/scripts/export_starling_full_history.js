#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CHUNK_DAYS = 30;
const DEFAULT_FROM_DATE = new Date("2000-01-01T00:00:00.000Z");

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) {
      continue;
    }
    const [rawKey, rawValue] = token.split("=", 2);
    const key = rawKey.replace(/^--/, "");
    if (rawValue !== undefined) {
      options[key] = rawValue;
      continue;
    }
    const maybeValue = args[index + 1];
    if (maybeValue && !maybeValue.startsWith("--")) {
      options[key] = maybeValue;
      index += 1;
      continue;
    }
    options[key] = "true";
  }
  return options;
}

function parseDateParam(value, fallback) {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
}

function formatCsvValue(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes("\"")) {
    return `"${stringValue.replace(/\"/g, '""')}"`;
  }
  return stringValue;
}

function mapFeedItemToCsvRow(item) {
  const amount =
    item.amount?.minorUnits ??
    item.totalAmount?.minorUnits ??
    item.sourceAmount?.minorUnits ??
    0;
  const currency =
    item.amount?.currency ??
    item.totalAmount?.currency ??
    item.sourceAmount?.currency ??
    "GBP";
  const occurredAt = item.transactionTime ?? item.updatedAt ?? new Date().toISOString();

  return [
    item.feedItemUid,
    occurredAt,
    item.updatedAt ?? "",
    item.direction ?? "",
    item.status ?? "",
    amount,
    currency,
    item.source ?? "",
    item.spendingCategory ?? "",
    item.counterPartyName ?? "",
    item.counterPartyType ?? "",
    item.counterPartyUid ?? "",
    item.merchantUid ?? "",
    item.reference ?? "",
    item.description ?? "",
    item.feedItemType ?? "",
    item.categoryUid ?? "",
    JSON.stringify(item),
  ]
    .map(formatCsvValue)
    .join(",");
}

function buildChunks(from, to) {
  const chunks = [];
  let cursor = new Date(from);
  while (cursor < to) {
    const next = new Date(
      Math.min(cursor.getTime() + MAX_CHUNK_DAYS * DAY_MS, to.getTime())
    );
    chunks.push({ start: new Date(cursor), end: new Date(next) });
    cursor = new Date(next.getTime() + 1000);
  }
  return chunks;
}

async function resolveAccount(token) {
  const response = await fetch("https://api.starlingbank.com/api/v2/accounts", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Unable to fetch Starling account metadata (${response.status}). ${errorBody}`
    );
  }

  const payload = await response.json();
  let account =
    Array.isArray(payload?.accounts) && payload.accounts.length > 0
      ? payload.accounts[0]
      : null;
  if (!account) {
    if (Array.isArray(payload) && payload.length > 0) {
      account = payload[0];
    } else if (payload?.accounts && !Array.isArray(payload.accounts)) {
      account = payload.accounts;
    }
  }
  const accountUid = account?.accountUid;
  const defaultCategory =
    account?.defaultCategory?.categoryUid ??
    account?.defaultCategory ??
    (Array.isArray(account?.categories) && account.categories[0]?.categoryUid);

  if (!accountUid || !defaultCategory) {
    throw new Error(
      "Starling account metadata missing an account UID or default category."
    );
  }

  return {
    accountUid,
    categoryUid: defaultCategory,
  };
}

async function fetchFeedChunk(token, accountUid, categoryUid, start, end) {
  const params = new URLSearchParams({
    minTransactionTimestamp: start.toISOString(),
    maxTransactionTimestamp: end.toISOString(),
  });
  const url = `https://api.starlingbank.com/api/v2/feed/account/${accountUid}/category/${categoryUid}/transactions-between?${params}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Starling export failed (${response.status}). ${body}`);
  }

  const payload = await response.json();
  const feedItems =
    payload?.feedItems || payload?._embedded?.feedItems || payload?.items || [];
  return Array.isArray(feedItems) ? feedItems : [];
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const token = options.token || process.env.STARLING_ACCESS_TOKEN;

  if (!token) {
    console.error(
      "Missing Starling access token. Pass it with --token or set STARLING_ACCESS_TOKEN."
    );
    process.exit(1);
  }

  const fromDate = parseDateParam(options.from, DEFAULT_FROM_DATE);
  const toDate = parseDateParam(options.to, new Date());

  if (fromDate > toDate) {
    console.error("`from` must be earlier than `to`.");
    process.exit(1);
  }

  console.log(`Resolving Starling account metadata...`);
  const { accountUid, categoryUid } = await resolveAccount(token);
  console.log(
    `Resolved account ${accountUid} and category ${categoryUid}. Fetching feed...`
  );

  const chunks = buildChunks(fromDate, toDate);
  const allItems = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    console.log(
      `Chunk ${index + 1}/${chunks.length}: ${chunk.start.toISOString()} -> ${chunk.end.toISOString()}`
    );
    const items = await fetchFeedChunk(
      token,
      accountUid,
      categoryUid,
      chunk.start,
      chunk.end
    );
    console.log(`  Retrieved ${items.length} records.`);
    allItems.push(...items);
  }

  const header = [
    "feedItemUid",
    "transactionTime",
    "updatedAt",
    "direction",
    "status",
    "amountMinor",
    "currency",
    "source",
    "spendingCategory",
    "counterPartyName",
    "counterPartyType",
    "counterPartyUid",
    "merchantUid",
    "reference",
    "description",
    "feedItemType",
    "categoryUid",
    "raw",
  ].join(",");

  const rows = allItems.map(mapFeedItemToCsvRow);
  const csv = [header, ...rows].join("\n");
  const outputPath = path.resolve(
    options.output || `starling-full-history-${fromDate.toISOString().slice(0, 10)}.csv`
  );

  fs.writeFileSync(outputPath, csv, "utf8");
  console.log(`Wrote ${allItems.length} rows to ${outputPath}`);
}

main().catch((error) => {
  console.error("Export failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
