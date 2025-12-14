import { parseCsv, logStep, logProgress, findDataFile, combineName, upsertContact, findContactByEmailOrPhone, prisma } from "./utils";

export async function importAdsLeads() {
  logStep("Importing Ads leads");
  const file = await findDataFile("Ads Leads");
  const rows = await parseCsv<{ [key: string]: string }>(file);
  let imported = 0;
  const total = rows.length;

  for (const row of rows) {
    const email = row["Email"];
    const phone = row["Phone"];
    if (!email && !phone) continue;

    const existing = await findContactByEmailOrPhone(email, phone);
    const status = existing?.status === "client" ? "client" : "lead";

    await upsertContact({
      email,
      phone,
      fullName: combineName(row["First Name"], row["Last Name"]),
      status,
      sourceTags: ["ads"],
    });
    imported += 1;
    logProgress(imported, total, "Ads Leads");
  }
  process.stdout.write("\n");
  logStep(`Imported ${imported} ad-sourced leads.`);
}
