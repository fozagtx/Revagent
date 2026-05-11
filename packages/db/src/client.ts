import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _client: postgres.Sql | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb(databaseUrl?: string) {
  if (_db) return _db;
  const url = databaseUrl ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  _client = postgres(url, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
  });
  _db = drizzle(_client, { schema });
  return _db;
}

export async function closeDb() {
  if (_client) {
    await _client.end({ timeout: 5 });
    _client = null;
    _db = null;
  }
}

export type Db = ReturnType<typeof getDb>;
export { schema };
