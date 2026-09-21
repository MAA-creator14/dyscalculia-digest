import { neon } from "@neondatabase/serverless";

/**
 * Lazy singleton. A top-level `neon(process.env.DATABASE_URL)` call throws at
 * build time, before Marketplace-provisioned env vars exist — see vercel-storage
 * guidance. Deliberately a plain function + `let`, not a Proxy: Proxy wrappers
 * around DB clients can break libraries that inspect the client object's shape.
 */
let sqlClient: ReturnType<typeof neon> | null = null;
export function getSql() {
  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL!);
  }
  return sqlClient;
}
