import type { Metadata } from "next";
import { Unavailable } from "@/components/public/unavailable";

export const metadata: Metadata = { title: "Menú no disponible", robots: { index: false, follow: false } };

export default function Page() {
  return <Unavailable />;
}
