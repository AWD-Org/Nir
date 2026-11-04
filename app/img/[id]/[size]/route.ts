import { col } from "@/lib/server/db";

// Una imagen nunca se sobrescribe (cada foto nueva tiene otro id), así que la respuesta
// se guarda en caché de forma permanente: Firestore se lee solo la primera vez.
export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; size: string }> }) {
  const { id, size } = await params;
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id) || (size !== "thumb" && size !== "full")) {
    return new Response("No encontrada", { status: 404 });
  }
  const snap = await col.images().doc(id).get();
  const data = snap.data();
  const bytes: Buffer | Uint8Array | undefined = data?.[size];
  if (!bytes) return new Response("No encontrada", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": data?.mime ?? "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
