import type { Db } from "@/lib/db/index.server";

/** Today's date in Sydney (YYYY-MM-DD), matching the day the cap query counts against. */
export async function sydneyToday(_db?: Db): Promise<string> {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
}
