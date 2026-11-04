import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function Page() {
  return (
    <>
      <h1 className="text-[28px] font-semibold leading-tight">Entra a tu negocio</h1>
      <p className="mt-2 text-ink-2">Edita tu carta, tus enlaces y revisa cuántas mesas te visitan.</p>
      <div className="mt-8">
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </div>
      <p className="mt-8 text-center text-[15px] text-ink-2">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-brand-strong underline-offset-4 hover:underline">
          Crea una
        </Link>
      </p>
    </>
  );
}
