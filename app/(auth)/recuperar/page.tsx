import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false } };

export default function Page() {
  return (
    <>
      <h1 className="text-[28px] font-semibold leading-tight">Recupera tu contraseña</h1>
      <p className="mt-2 text-ink-2">Te mandamos un enlace a tu correo para crear una nueva.</p>
      <div className="mt-8">
        <ResetForm />
      </div>
    </>
  );
}
