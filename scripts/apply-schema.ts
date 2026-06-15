import { execSync } from "node:child_process";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

function dbPathFromUrl(url: string) {
  if (!url.startsWith("file:")) return null;
  return url.replace(/^file:/, "");
}

async function main() {
  const dbPath = dbPathFromUrl(process.env.DATABASE_URL || "");
  if (dbPath && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const sql = execSync("npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script", {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"]
  });

  const prisma = new PrismaClient();
  const executableSql = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const statements = executableSql
    .split(/;\s*\r?\n/)
    .map((statement) => statement.trim())
    .filter((statement) => statement && !statement.startsWith("--"));

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  await prisma.$disconnect();
  console.log(`Applied ${statements.length} schema statements`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
