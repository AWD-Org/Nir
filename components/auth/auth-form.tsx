"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { authMessage, loginEmail, loginGoogle, registerEmail } from "./auth-client";
import { GoogleGlyph } from "./google-button";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const register = mode === "register";

  const go = (next: string) => {
    const wanted = params.get("next");
    router.replace(wanted && wanted.startsWith("/") && !wanted.startsWith("//") && next !== "/admin/bienvenida" ? wanted : next);
    router.refresh();
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (register && !terms) return setError("Acepta los términos y el aviso de privacidad para crear tu cuenta.");
    if (register && password.length < 8) return setError("Usa una contraseña de al menos 8 caracteres.");
    setBusy("email");
    try {
      go(register ? await registerEmail(name, email, password) : await loginEmail(email, password));
    } catch (err) {
      setError(authMessage(err));
      setBusy(null);
    }
  }

  async function onGoogle() {
    setError(null);
    if (register && !terms) return setError("Acepta los términos y el aviso de privacidad para crear tu cuenta.");
    setBusy("google");
    try {
      go(await loginGoogle(register));
    } catch (err) {
      setError(authMessage(err));
      setBusy(null);
    }
  }

  return (
    <div>
      <button type="button" onClick={onGoogle} disabled={!!busy} className="btn-secondary w-full">
        {busy === "google" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleGlyph />}
        {register ? "Crear cuenta con Google" : "Entrar con Google"}
      </button>

      <div className="my-6 flex items-center gap-3 text-sm text-ink-2">
        <span className="h-px flex-1 bg-line" />o con tu correo<span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {register && (
          <div>
            <label htmlFor="name" className="label">Tu nombre</label>
            <input id="name" className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div>
          <label htmlFor="email" className="label">Correo</label>
          <input id="email" type="email" className="field" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="label">Contraseña</label>
            {!register && (
              <Link href="/recuperar" className="text-sm text-brand-strong underline-offset-4 hover:underline">
                ¿La olvidaste?
              </Link>
            )}
          </div>
          <input
            id="password"
            type="password"
            className="field"
            autoComplete={register ? "new-password" : "current-password"}
            required
            minLength={register ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {register && <p className="hint">Mínimo 8 caracteres.</p>}
        </div>

        {register && (
          <label className="flex items-start gap-3 text-[15px] text-ink-2">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[#D60451]" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>
              Acepto los{" "}
              <Link href="/terminos" className="text-ink underline underline-offset-4" target="_blank">términos de servicio</Link>{" "}
              y el{" "}
              <Link href="/privacidad" className="text-ink underline underline-offset-4" target="_blank">aviso de privacidad</Link>.
            </span>
          </label>
        )}

        {error && (
          <p role="alert" className="rounded-md border border-bad/20 bg-bad-tint px-3 py-2 text-[15px] text-bad">
            {error}
          </p>
        )}

        <button type="submit" disabled={!!busy} className="btn-primary w-full">
          {busy === "email" && <Loader2 className="h-5 w-5 animate-spin" />}
          {register ? "Crear mi cuenta" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
