import { parseCsv, logStep, logProgress, findDataFile, combineName, parseFlexibleDate, upsertContact } from "./utils";

export async function importGlofoxClients() {
  logStep("Importing Glofox clients");
  const file = await findDataFile("Glofox Clients");
  const rows = await parseCsv<{ [key: string]: string }>(file);
  let imported = 0;
  const total = rows.length;

  for (const row of rows) {
    const email = row["Email"];
    const phone = row["Phone"];
    if (!email && !phone) {
      // Skip count or just continue? counting towards total so we should progress
      continue;
    }

    await upsertContact({
      email,
      phone,
      fullName: combineName(row["First Name"], row["Last Name"]),
      status: "client",
      sourceTags: ["glofox"],
      membershipType: row["Membership Name"] || row["Membership Plan"],
      membershipEndDate: parseFlexibleDate(row["Membership Expiry Date"]),
      firstSeenAt: parseFlexibleDate(row["Added"] ?? row["Last Booking"]),
    });
    imported += 1;
    logProgress(imported, total, "Glofox Clients");
  }
  process.stdout.write("\n");
  logStep(`Imported ${imported} Glofox client contacts.`);
}
