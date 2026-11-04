import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false } };

export default function Page() {
  return (
    <>
      <h1 className="text-[28px] font-semibold leading-tight">Crea la cuenta de tu negocio</h1>
      <p className="mt-2 text-ink-2">
        Arma tu página y tu carta desde hoy. Se publica cuando instalamos tus tarjetas Nir.
      </p>
      <div className="mt-8">
        <Suspense>
          <AuthForm mode="register" />
        </Suspense>
      </div>
      <p className="mt-8 text-center text-[15px] text-ink-2">
        ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="font-medium text-brand-strong underline-offset-4 hover:underline">
          Entra
        </Link>
      </p>
    </>
  );
}
