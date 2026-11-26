import { z } from "zod";

// The variables the app needs today. Later tasks add theirs here and in .env.example (T11/T12: VISION_MODE, AI_MODE,
// ANTHROPIC_API_KEY, ANTHROPIC_MODEL, SCANS_PER_DAY).
// Browser-visible: NEXT_PUBLIC_* only. Everything else is read on the server and never reaches a client bundle.
const optional = z.string().optional().transform((v) => v || undefined);
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  /** Optional curtain for staging and demos (src/lib/gate). Unset or empty = no curtain. */
  SITE_PASSWORD: optional.pipe(z.string().min(8).optional()),
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
