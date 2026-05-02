import { PrismaPg } from "@prisma/adapter-pg";

import { getServerEnv } from "@/lib/env";

function ensurePostgresConnectionString(databaseUrl: string) {
  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new Error(
      "DATABASE_URL must be a PostgreSQL connection string, for example postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require.",
    );
  }
}

export function createPrismaAdapter(
  connectionString = process.env.DATABASE_URL,
) {
  const databaseUrl = connectionString ?? getServerEnv().DATABASE_URL;
  ensurePostgresConnectionString(databaseUrl);

  return new PrismaPg({
    connectionString: databaseUrl,
  });
}
