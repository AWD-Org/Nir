"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { ImagePicker } from "@/components/admin/image-picker";
import { refreshSession } from "@/components/auth/auth-client";
import { slugify } from "@/lib/domain/slug";
import { checkSlug, createBusiness } from "../actions";
import { SITE_URL } from "@/lib/domain/links";

const STEPS = ["Tu negocio", "Logo", "Portada"];

export function Wizard({ needsTerms, initialStep = 0 }: { needsTerms: boolean; initialStep?: number }) {
  const router = useRouter();
  const [step, setStepState] = useState(initialStep);
  const setStep = (n: number) => {
    setStepState(n);
    if (n > 0) router.replace(`/admin/bienvenida?paso=${n === 1 ? "logo" : "portada"}`, { scroll: false });
  };
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [check, setCheck] = useState<{ available: boolean; message: string } | null>(null);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [logo, setLogo] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (slug.length < 3) return setCheck(null);
    const t = setTimeout(async () => setCheck(await checkSlug(slug)), 350);
    return () => clearTimeout(t);
  }, [slug]);

  function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (needsTerms && !terms) return setError("Acepta los términos y el aviso de privacidad para continuar.");
    start(async () => {
      const r = await createBusiness({ name, slug, acceptTerms: terms });
      if (!r.ok) return setError(r.error);
      await refreshSession().catch(() => {});
      setStep(1);
    });
  }

  const finish = () => {
    router.replace("/admin");
    router.refresh();
  };

  return (
    <div>
      <ol className="mb-8 flex gap-2" aria-label="Pasos">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className="h-1 overflow-hidden rounded-full bg-line">
              <div className="h-full origin-left bg-brand-strong transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `scaleX(${i <= step ? 1 : 0})` }} />
            </div>
            <p className={`mt-2 text-sm ${i === step ? "font-medium text-ink" : "text-ink-2"}`} aria-current={i === step ? "step" : undefined}>
              {s}
            </p>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <form onSubmit={create} className="anim-in-right space-y-5">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight">¿Cómo se llama tu negocio?</h1>
            <p className="mt-2 text-ink-2">Con este nombre armamos la dirección que va grabada en tus tarjetas.</p>
          </div>
          <div>
            <label htmlFor="bname" className="label">Nombre del negocio</label>
            <input id="bname" className="field" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label htmlFor="slug" className="label">Dirección de tu página</label>
            <div className="flex items-center rounded-[var(--radius-ctl)] border border-line-2 bg-surface focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10">
              {/* El dominio completo no cabe junto al campo en celular: ahí se muestra debajo. */}
              <span className="num hidden select-none whitespace-nowrap pl-3 text-[15px] text-ink-2 sm:inline">{SITE_URL.replace(/^https?:\/\//, "")}/</span>
              <span className="num select-none pl-3 text-[15px] text-ink-2 sm:hidden">/</span>
              <input
                id="slug"
                className="num min-h-11 w-full min-w-0 bg-transparent py-2 pr-3 text-[15px] focus:outline-none"
                value={slug}
                maxLength={40}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                }}
                aria-describedby="slug-help"
              />
            </div>
            <p id="slug-help" className={`hint flex items-center gap-1.5 ${check ? (check.available ? "text-ok" : "text-bad") : ""}`} aria-live="polite">
              {check?.available && <Check className="h-4 w-4" />}
              {check ? check.message : "Letras minúsculas, números y guiones. Queda fija cuando grabemos tus tarjetas."}
            </p>
            <p className="num mt-1 break-all text-[13px] text-ink-3 sm:hidden">
              {SITE_URL.replace(/^https?:\/\//, "")}/{slug || "tu-negocio"}
            </p>
          </div>
          {needsTerms && (
            <label className="flex items-start gap-3 text-[15px] text-ink-2">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[#D60451]" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span>
                Acepto los <Link href="/terminos" target="_blank" className="text-ink underline underline-offset-4">términos de servicio</Link> y el{" "}
                <Link href="/privacidad" target="_blank" className="text-ink underline underline-offset-4">aviso de privacidad</Link>.
              </span>
            </label>
          )}
          {error && <p role="alert" className="rounded-md border border-bad/20 bg-bad-tint px-3 py-2 text-[15px] text-bad">{error}</p>}
          <button className="btn-primary w-full" disabled={pending || !name.trim() || check?.available === false}>
            {pending && <Loader2 className="h-5 w-5 animate-spin" />}
            Crear mi negocio
          </button>
        </form>
      )}

      {step === 1 && (
        <div key="s1" className="anim-in-right space-y-6">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight">Sube tu logo</h1>
            <p className="mt-2 text-ink-2">Aparece arriba de tu página y en tus tarjetas. Lo recortamos en cuadrado.</p>
          </div>
          <ImagePicker kind="logo" label="Logo" imageId={logo} onChange={setLogo} />
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep(2)}>Después</button>
            <button className="btn-primary flex-1" disabled={!logo} onClick={() => setStep(2)}>Continuar</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div key="s2" className="anim-in-right space-y-6">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight">Elige una foto de portada</h1>
            <p className="mt-2 text-ink-2">La fachada, la barra o tu platillo más pedido. Se ve en horizontal.</p>
          </div>
          <ImagePicker kind="cover" label="Portada" aspect="wide" imageId={cover} onChange={setCover} />
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={finish}>Después</button>
            <button className="btn-primary flex-1" disabled={!cover} onClick={finish}>Ir a mi carta</button>
          </div>
        </div>
      )}
    </div>
  );
}
