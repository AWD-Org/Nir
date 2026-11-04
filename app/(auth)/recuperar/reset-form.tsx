"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { authMessage, resetPassword } from "@/components/auth/auth-client";

export function ResetForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("busy");
    try {
      await resetPassword(email);
      setState("sent");
    } catch (err) {
      // No revelamos si el correo existe.
      if ((err as { code?: string }).code === "auth/user-not-found") setState("sent");
      else {
        setError(authMessage(err));
        setState("idle");
      }
    }
  }

  if (state === "sent") {
    return (
      <div className="panel p-5">
        <p className="font-medium">Revisa tu correo</p>
        <p className="mt-1 text-ink-2">
          Si hay una cuenta con <span className="font-medium text-ink">{email}</span>, en unos minutos te llega el enlace. Revisa también la carpeta de spam.
        </p>
        <Link href="/entrar" className="btn-secondary mt-5 w-full">Volver a entrar</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Correo de tu cuenta</label>
        <input id="email" type="email" required className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p role="alert" className="rounded-md border border-bad/20 bg-bad-tint px-3 py-2 text-[15px] text-bad">{error}</p>}
      <button type="submit" disabled={state === "busy"} className="btn-primary w-full">
        {state === "busy" && <Loader2 className="h-5 w-5 animate-spin" />}
        Enviar enlace
      </button>
      <Link href="/entrar" className="btn-ghost w-full">Volver</Link>
    </form>
  );
}
