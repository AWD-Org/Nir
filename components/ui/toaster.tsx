"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        style: { fontFamily: "var(--font-sans)", borderRadius: "0.5rem", fontSize: "15px" },
      }}
    />
  );
}
