import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type LeadPayload = {
  externalId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  channel?: string;
  stage?: string;
  owner?: string;
  nextStep?: string;
  valueMinor?: number | null;
  membershipName?: string;
  metadata?: Record<string, unknown>;
};

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, data: leads });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load leads from the database.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { leads?: LeadPayload[] };
    const leads = Array.isArray(body.leads) ? body.leads : [];

    if (!leads.length) {
      return NextResponse.json(
        { ok: false, message: "Provide at least one lead to import." },
        { status: 400 }
      );
    }

    const externalIds = leads.map(
      (lead) => lead.externalId ?? `import_${randomUUID()}`
    );
    const existing = await prisma.lead.findMany({
      where: { externalId: { in: externalIds } },
      select: { externalId: true },
    });
    const existingSet = new Set(existing.map((lead) => lead.externalId ?? ""));

    let created = 0;

    await Promise.all(
      leads.map((lead, index) =>
        prisma.lead
          .upsert({
            where: { externalId: externalIds[index] },
            update: {
              firstName: lead.firstName,
              lastName: lead.lastName,
              email: lead.email,
              phone: lead.phone,
              channel: lead.channel,
              stage: lead.stage,
              owner: lead.owner,
              nextStep: lead.nextStep,
              valueMinor: lead.valueMinor ?? null,
              membershipName: lead.membershipName,
              metadata: lead.metadata ?? undefined,
            },
            create: {
              externalId: externalIds[index],
              firstName: lead.firstName,
              lastName: lead.lastName,
              email: lead.email,
              phone: lead.phone,
              channel: lead.channel,
              stage: lead.stage,
              owner: lead.owner,
              nextStep: lead.nextStep,
              valueMinor: lead.valueMinor ?? null,
              membershipName: lead.membershipName,
              metadata: lead.metadata ?? undefined,
            },
          })
          .then(() => {
            if (!existingSet.has(externalIds[index])) {
              created += 1;
            }
          })
      )
    );

    return NextResponse.json({
      ok: true,
      message: `Imported ${leads.length} lead${
        leads.length === 1 ? "" : "s"
      } (${created} new).`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to import leads.",
      },
      { status: 500 }
    );
  }
}
