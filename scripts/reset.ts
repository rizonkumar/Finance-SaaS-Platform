import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { count, sql } from "drizzle-orm";

import {
  accounts,
  budgets,
  categories,
  debtPayments,
  debts,
  goalContributions,
  goals,
  holdings,
  recurringTransactions,
  trades,
  transactions,
} from "@/db/schema";

config({ path: [".env.local", ".env"] });

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set. Nothing to do.");
  process.exit(1);
}

const client = neon(url);
const db = drizzle(client);

// Children before parents. Some of these would cascade anyway, but an explicit
// order means the script does not depend on which FKs happen to be ON DELETE
// CASCADE today.
const TABLES = [
  { name: "trades", table: trades },
  { name: "goal_contributions", table: goalContributions },
  { name: "debt_payments", table: debtPayments },
  { name: "holdings", table: holdings },
  { name: "transactions", table: transactions },
  { name: "recurring_transactions", table: recurringTransactions },
  { name: "budgets", table: budgets },
  { name: "goals", table: goals },
  { name: "debts", table: debts },
  { name: "accounts", table: accounts },
  { name: "categories", table: categories },
] as const;

// Dropping the tables alone is not enough to make `db:migrate` rebuild them:
// the enum types would collide on re-create, and the migration journal would
// still claim every migration had already run.
const ENUM_TYPES = [
  "account_type",
  "budget_period",
  "debt_kind",
  "recurring_frequency",
  "trade_side",
] as const;

// Never print the full connection string — it carries credentials.
const describeTarget = () => {
  try {
    const { hostname, pathname } = new URL(url);
    return `${hostname}${pathname}`;
  } catch {
    return "unparseable DATABASE_URL";
  }
};

const rowCounts = () =>
  Promise.all(
    TABLES.map(async ({ name, table }) => {
      const [row] = await db.select({ value: count() }).from(table);
      return { name, rows: row?.value ?? 0 };
    })
  );

// Anything in `public` that our schema does not define — flagged rather than
// dropped, since it is not ours to assume about.
const unmanagedTables = async () => {
  const managed = new Set<string>(TABLES.map((entry) => entry.name));

  const rows = await client`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'`;

  return rows
    .map((row) => String(row.table_name))
    .filter((name) => !managed.has(name));
};

const clearRows = async (total: number) => {
  for (const { name, table } of TABLES) {
    await db.delete(table).execute();
    console.log(`  cleared ${name}`);
  }

  console.log(`\nDeleted ${total} rows. Every table is now empty.\n`);
};

const dropEverything = async () => {
  for (const { name } of TABLES) {
    await db.execute(
      sql.raw(`DROP TABLE IF EXISTS "public"."${name}" CASCADE`)
    );
    console.log(`  dropped table ${name}`);
  }

  for (const type of ENUM_TYPES) {
    await db.execute(sql.raw(`DROP TYPE IF EXISTS "public"."${type}" CASCADE`));
    console.log(`  dropped type ${type}`);
  }

  await db.execute(sql.raw(`DROP SCHEMA IF EXISTS "drizzle" CASCADE`));
  console.log("  dropped migration journal (schema drizzle)");

  console.log("\nDatabase is bare. Rebuild it with:\n\n  npm run db:migrate\n");
};

const main = async () => {
  const confirmed = process.argv.includes("--yes");
  const drop = process.argv.includes("--drop");

  console.log(`\nTarget database: ${describeTarget()}\n`);

  const counts = await rowCounts();

  for (const { name, rows } of counts) {
    console.log(`  ${name.padEnd(24)} ${rows}`);
  }

  const total = counts.reduce((sum, entry) => sum + entry.rows, 0);
  const extras = await unmanagedTables();

  if (extras.length > 0) {
    console.log(
      `\nNot managed by this app, left untouched: ${extras.join(", ")}`
    );
    console.log(
      `  remove manually if you want them gone, e.g.` +
        ` DROP TABLE "public"."${extras[0]}";`
    );
  }

  if (!confirmed) {
    console.log(
      drop
        ? `\nWould DROP all ${TABLES.length} tables, ${ENUM_TYPES.length} enum` +
            ` types and the migration journal (${total} rows lost).` +
            `\nThis cannot be undone. Re-run to confirm:\n\n` +
            `  npm run db:reset -- --drop --yes\n`
        : `\n${total} rows would be deleted, tables kept.` +
            `\nThis cannot be undone. Re-run to confirm:\n\n` +
            `  npm run db:reset -- --yes\n` +
            `\nTo remove the tables themselves too, add --drop.\n`
    );
    return;
  }

  console.log("");

  if (drop) {
    await dropEverything();
    return;
  }

  if (total === 0) {
    console.log("Already empty. Nothing deleted.\n");
    return;
  }

  await clearRows(total);
};

main().catch((error) => {
  console.error("Error during reset:", error);
  process.exit(1);
});
