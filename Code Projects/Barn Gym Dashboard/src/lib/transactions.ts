import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type NormalizedTransaction = {
  externalId: string;
  provider: string;
  amountMinor: number;
  currency: string;
  occurredAt: string;
  personName?: string;
  productType?: string;
  status: string;
  confidence: string;
  description?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  raw?: Record<string, unknown>;
  leadId?: string | null;
};

export async function upsertTransactions(records: NormalizedTransaction[]) {
  if (!records.length) {
    return { added: 0, total: await prisma.transaction.count() };
  }

  const externalIds = records.map((record) => record.externalId);
  const existing = await prisma.transaction.findMany({
    where: { externalId: { in: externalIds } },
    select: { externalId: true },
  });
  const existingSet = new Set(existing.map((record) => record.externalId));

  let added = 0;

  for (const record of records) {
    const rawPayload = (record.raw ?? undefined) as
      | Prisma.InputJsonValue
      | undefined;
    const metadataPayload = (record.metadata ?? undefined) as
      | Prisma.InputJsonValue
      | undefined;

    await prisma.transaction
      .upsert({
        where: { externalId: record.externalId },
        update: {
          amountMinor: record.amountMinor,
          currency: record.currency,
          occurredAt: new Date(record.occurredAt),
          personName: record.personName,
          productType: record.productType,
          status: record.status,
          confidence: record.confidence,
          description: record.description,
          reference: record.reference,
          raw: rawPayload,
          metadata: metadataPayload,
          leadId: record.leadId ?? undefined,
        },
        create: {
          externalId: record.externalId,
          provider: record.provider,
          amountMinor: record.amountMinor,
          currency: record.currency,
          occurredAt: new Date(record.occurredAt),
          personName: record.personName,
          productType: record.productType,
          status: record.status,
          confidence: record.confidence,
          description: record.description,
          reference: record.reference,
          raw: rawPayload,
          metadata: metadataPayload,
          leadId: record.leadId ?? undefined,
        },
      })
      .then(() => {
        if (!existingSet.has(record.externalId)) {
          added += 1;
        }
      })
      .catch((error) => {
        console.error("Failed to upsert transaction", record.externalId, error);
      });
  }

  const total = await prisma.transaction.count();
  return { added, total };
}

export async function listTransactions() {
  return prisma.transaction.findMany({
    orderBy: { occurredAt: "desc" },
  });
}
