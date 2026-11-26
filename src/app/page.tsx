import { enCA } from "@/lib/i18n/en-CA";

// Placeholder home until T05 (sign in) and T09 (Today).
export default function Home() {
  const t = enCA.home;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-5 py-10">
      <div aria-hidden className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
        <div className="h-7 w-7 rounded-full border-4 border-mint" />
      </div>
      <h1 className="font-title text-title font-bold tracking-tight">{t.title}</h1>
      <p className="text-body text-ink">{t.tagline}</p>
      <div className="rounded-card bg-card p-5 text-muted">{t.comingSoon}</div>
    </main>
  );
}
