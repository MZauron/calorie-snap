"use client";
// From MZauron/playdate src/app/gate/GateForm.tsx @ eeb9dd8 (plain elements until T06 brings Button and Field).

import { useActionState } from "react";
import { enCA } from "@/lib/i18n/en-CA";
import { openGateAction, type GateState } from "./actions";

export function GateForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<GateState, FormData>(openGateAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="gate-password" className="text-label font-semibold text-muted">
        {enCA.gate.label}
      </label>
      <input
        id="gate-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "gate-error" : undefined}
        className="h-button rounded-button border border-line bg-card px-4 text-body"
      />
      {state.error ? (
        <p id="gate-error" role="alert" className="text-label text-over-text">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="h-button rounded-button bg-primary font-semibold text-white disabled:opacity-60">
        {enCA.gate.submit}
      </button>
    </form>
  );
}
