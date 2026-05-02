import { z } from "zod";

const requiredServerEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  NEXTAUTH_SECRET: z.string().min(24, "NEXTAUTH_SECRET must be at least 24 characters."),
  NEXTAUTH_URL: z.url("NEXTAUTH_URL must be a valid URL."),
  SITE_URL: z.url("SITE_URL must be a valid URL."),
});

let cachedEnv: z.infer<typeof requiredServerEnvSchema> | null = null;

export function getServerEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = requiredServerEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid server environment: ${message}`);
  }

  const isProductionRuntime =
    process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";

  if (isProductionRuntime && /replace|development|changeme/i.test(parsed.data.NEXTAUTH_SECRET)) {
    throw new Error(
      "Invalid server environment: NEXTAUTH_SECRET must be a strong production secret.",
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getOptionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length ? value : undefined;
}
