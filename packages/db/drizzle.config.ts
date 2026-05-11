import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://revagent:revagent@localhost:5432/revagent",
  },
  strict: true,
  verbose: true,
} satisfies Config;
