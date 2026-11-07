"use client";

import { PublicView } from "@/components/public/public-view";
import type { PublicPage } from "@/lib/domain/types";
import { demoPhoto } from "@/lib/demo-photos";

/** Solo arnés: carta con fotos dibujadas para comparar estilos. */
export function DemoPhotosView({ page }: { page: PublicPage }) {
  return <PublicView page={page} mode="preview" forceView="menu" resolveImage={(id) => demoPhoto(id)} />;
}
