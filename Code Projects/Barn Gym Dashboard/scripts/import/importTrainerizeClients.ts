import { parseCsv, logStep, logProgress, findDataFile, combineName, upsertContact } from "./utils";

export async function importTrainerizeClients() {
  logStep("Importing Trainerize clients");
  const file = await findDataFile("Trainerize Clients");
  const rows = await parseCsv<{ [key: string]: string }>(file);
  let imported = 0;
  const total = rows.length;

  for (const row of rows) {
    const email = row["Email"];
    const phone = row["Phone"];
    if (!email && !phone) continue;

    await upsertContact({
      email,
      phone,
      fullName: combineName(row["First Name"], row["Last Name"]),
      status: "client",
      sourceTags: ["trainerize"],
      segmentTags: ["online"],
      trainerizeId: row["Trainer"],
    });
    imported += 1;
    logProgress(imported, total, "Trainerize Clients");
  }
  process.stdout.write("\n");
  logStep(`Imported ${imported} Trainerize contacts.`);
}
