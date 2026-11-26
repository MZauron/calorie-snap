import { z } from "zod";

// The variables the app needs today. Later tasks add theirs here and in .env.example (T03/T04: Supabase; T11/T12: VISION_MODE,
// AI_MODE, ANTHROPIC_API_KEY, ANTHROPIC_MODEL, SCANS_PER_DAY).
// Browser-visible: NEXT_PUBLIC_* only. Everything else is read on the server and never reaches a client bundle.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    // Names of the bad variables only, never their values.
    const names = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment: ${names}`);
  }
  return result.data;
}

export const env = parseEnv(process.env);
