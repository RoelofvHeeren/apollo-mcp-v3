import { parse } from "csv-parse";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../../src/generated/prisma";
import type { ParseOptions } from "csv-parse";

export const prisma = new PrismaClient();

export type CsvRow = Record<string, string | undefined>;

type NullableArray = Array<string | undefined> | undefined;

export async function parseCsv<T extends CsvRow = CsvRow>(
  filePath: string,
  options: ParseOptions<Record<string, unknown>> = {}
): Promise<T[]> {
  const resolved = path.resolve(process.cwd(), filePath);
  const fileContents = await fs.promises.readFile(resolved, "utf8");
  return new Promise<T[]>((resolve, reject) => {
    parse(
      fileContents,
      {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        ...options,
      },
      (error, output) => {
        if (error) return reject(error);
        resolve(output as T[]);
      }
    );
  });
}

export function normalizeEmail(value?: string | number): string | undefined {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim().toLowerCase();
  return normalized.length ? normalized : undefined;
}

export function normalizePhone(value?: string | number): string | undefined {
  if (value === undefined || value === null) return undefined;
  const digits = String(value).replace(/[^0-9]/g, "");
  if (!digits.length) return undefined;
  return digits;
}

export function normalizeName(value?: string | number): string | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
}

export function parseFlexibleDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const cleaned = value.trim();
  if (!cleaned) return undefined;
  const iso = new Date(cleaned);
  if (!Number.isNaN(iso.getTime())) {
    return iso;
  }
  const parts = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (parts) {
    const [, dayRaw, monthRaw, yearRaw] = parts;
    const day = Number(dayRaw.padStart(2, "0"));
    const month = Number(monthRaw.padStart(2, "0"));
    const year = yearRaw.length === 2 ? Number(`20${yearRaw}`) : Number(yearRaw);
    return new Date(Date.UTC(year, month - 1, day));
  }
  return undefined;
}

export function combineName(first?: string, last?: string): string | undefined {
  const firstPart = normalizeName(first);
  const lastPart = normalizeName(last);
  if (firstPart && lastPart) return `${firstPart} ${lastPart}`;
  return firstPart || lastPart;
}

export function logStep(message: string) {
  console.log(`\n=== ${message}`);
}

export function logProgress(current: number, total: number, label: string = "Processed") {
  if (current % 50 === 0 || current === total) {
    const percent = Math.round((current / total) * 100);
    process.stdout.write(`\r> ${label}: ${current}/${total} (${percent}%)`);
  }
}

export async function findContactByEmailOrPhone(email?: string, phone?: string) {
  const clauses = [];
  const normalEmail = normalizeEmail(email);
  const normalPhone = normalizePhone(phone);
  if (normalEmail) clauses.push({ email: normalEmail });
  if (normalPhone) clauses.push({ phone: normalPhone });
  if (!clauses.length) return null;
  return prisma.contact.findFirst({ where: { OR: clauses } });
}

function cleanTag(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length ? trimmed : undefined;
}

export function mergeTags(existing: string[] = [], additions: NullableArray = []): string[] {
  const set = new Set<string>(existing.filter(Boolean).map((tag) => tag.trim().toLowerCase()));
  if (additions) {
    for (const addition of additions.map(cleanTag).filter(Boolean) as string[]) {
      set.add(addition);
    }
  }
  return Array.from(set);
}

function earliestDate(a?: Date | null, b?: Date | null): Date | undefined {
  if (!a) return b ?? undefined;
  if (!b) return a ?? undefined;
  return a <= b ? a : b;
}

const dataDirectories = [
  path.resolve(process.cwd(), "Barn Gym Transaction : Member Data"),
  path.resolve(process.cwd(), "data"),
];

export async function findDataFile(prefix: string): Promise<string> {
  const normalized = prefix.toLowerCase();
  for (const directory of dataDirectories) {
    try {
      const entries = await fs.promises.readdir(directory);
      const match = entries.find((entry) =>
        entry.toLowerCase().includes(normalized)
      );
      if (match) {
        return path.join(directory, match);
      }
    } catch (error) {
      continue;
    }
  }
  throw new Error(`Unable to find data file for prefix "${prefix}"`);
}

export type ContactUpsertPayload = {
  email?: string;
  phone?: string;
  fullName?: string;
  status?: string;
  sourceTags?: string[];
  segmentTags?: string[];
  firstSeenAt?: Date;
  membershipType?: string;
  membershipEndDate?: Date;
  trainerizeId?: string;
};

export async function upsertContact(payload: ContactUpsertPayload) {
  const normalizedEmail = normalizeEmail(payload.email);
  const normalizedPhone = normalizePhone(payload.phone);
  const contact = await findContactByEmailOrPhone(normalizedEmail, normalizedPhone);
  const finalStatus =
    contact?.status === "client"
      ? "client"
      : payload.status ?? contact?.status ?? "lead";

  const sourceTags = mergeTags(contact?.sourceTags ?? [], payload.sourceTags);
  const segmentTags = mergeTags(contact?.segmentTags ?? [], payload.segmentTags);
  const firstSeen = earliestDate(contact?.firstSeenAt, payload.firstSeenAt) ?? payload.firstSeenAt;
  const membershipEndDate = payload.membershipEndDate ?? contact?.membershipEndDate;

  const data = {
    fullName: payload.fullName ?? contact?.fullName,
    email: normalizedEmail ?? contact?.email,
    phone: normalizedPhone ?? contact?.phone,
    status: finalStatus,
    sourceTags,
    segmentTags,
    membershipType: payload.membershipType ?? contact?.membershipType,
    membershipEndDate,
    trainerizeId: payload.trainerizeId ?? contact?.trainerizeId,
    firstSeenAt: firstSeen ?? undefined,
  };

  if (contact) {
    try {
      return await prisma.contact.update({ where: { id: contact.id }, data });
    } catch (error: any) {
      // If updating fails due to unique constraint on email, it means another contact has this email.
      // We should update THAT contact instead with the merged data.
      if (error?.code === "P2002" && normalizedEmail) {
        const resolved = await prisma.contact.findUnique({ where: { email: normalizedEmail } });
        if (resolved) {
          // Merge tags again against the resolved contact to be safe
          data.sourceTags = mergeTags(resolved.sourceTags ?? [], payload.sourceTags);
          data.segmentTags = mergeTags(resolved.segmentTags ?? [], payload.segmentTags);

          return prisma.contact.update({ where: { id: resolved.id }, data });
        }
      }
      throw error;
    }
  }

  try {
    return await prisma.contact.create({ data: { ...data, firstSeenAt: firstSeen ?? new Date() } });
  } catch (error: any) {
    if (error?.code === "P2002" && normalizedEmail) {
      const resolved = await prisma.contact.findUnique({ where: { email: normalizedEmail } });
      if (resolved) {
        return prisma.contact.update({ where: { id: resolved.id }, data });
      }
    }
    throw error;
  }
}
