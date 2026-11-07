import "@fontsource/big-shoulders-display/800";
import "@fontsource-variable/instrument-sans";
import "@fontsource/young-serif";
import "@fontsource-variable/schibsted-grotesk";
import { notFound } from "next/navigation";
import { MenuEditor } from "@/components/admin/menu-editor";
import { PageEditor } from "@/components/admin/page-editor";
import { AdminShell } from "@/components/admin/shell";
import { PublicView } from "@/components/public/public-view";
import { emptyBilling } from "@/lib/domain/billing";
import { DEFAULT_BUTTONS } from "@/lib/domain/constants";
import type { MenuDraft, Tenant, TemplateId } from "@/lib/domain/types";
import { demoPage } from "@/lib/demo";
import { DemoPhotosView } from "@/components/dev/demo-photos-view";
import { Phone } from "@/components/ui/phone";
import { MENU_STYLES } from "@/lib/themes";

// Arnés visual para revisar pantallas sin Firebase. Solo existe con NIR_DEV_HARNESS=1.
export const dynamic = "force-dynamic";

function fakeTenant(): Tenant {
  return {
    id: "t_demo", name: "Cantina El Ejemplo", slug: "cantina-el-ejemplo", ownerUid: "u", status: "preview",
    profile: { phone: "55 0000 0000", address: "Negocio de ejemplo", hours: "Mar a dom, 13:00 a 01:00", logoImageId: null, coverImageId: null },
    links: { googleReviewUrl: "https://g.page/r/ejemplo/review", instagram: "ejemplo", facebook: "", tiktok: "", whatsapp: "5215500000000" },
    wifi: { enabled: true, ssid: "ElEjemplo_Clientes", password: "botana2026" },
    buttons: DEFAULT_BUTTONS.map((b) => ({ ...b, enabled: true })),
    theme: { templateId: "noche", primaryColor: "#14161A", accentColor: "#E8B83A" },
    tables: [], billing: emptyBilling(), activatedAt: null, activatedBy: null, publishedAt: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

function fakeDraft(): MenuDraft {
  const page = demoPage("noche");
  const categories: MenuDraft["categories"] = {};
  const items: MenuDraft["items"] = {};
  page.menu.categories.forEach((c, ci) => {
    categories[c.id] = { name: c.name, order: ci, visible: true };
    c.items.forEach((i, ii) => (items[i.id] = { categoryId: c.id, name: i.name, description: i.description, priceCents: i.priceCents, variants: i.variants, tags: i.tags, imageId: null, available: i.available, order: ii }));
  });
  return { categories, items, itemCount: Object.keys(items).length, updatedAt: "", updatedBy: "" };
}

export default async function Harness({ params }: { params: Promise<{ screen: string }> }) {
  if (process.env.NIR_DEV_HARNESS !== "1") notFound();
  const { screen } = await params;
  const t = fakeTenant();
  if (screen === "publico-largo") {
    const base = demoPage("noche");
    const categories = Array.from({ length: 9 }, (_, c) => ({
      id: `c${c}`,
      name: ["Hamburguesas", "Burritos", "Snacks", "Hot dogs", "Chapatas", "Cervezas", "Cócteles", "Tequila", "Refrescos"][c],
      items: Array.from({ length: 12 }, (_, i) => ({ id: `c${c}i${i}`, name: `Producto ${c + 1}.${i + 1}`, description: "Descripción de ejemplo para medir el largo de la carta.", priceCents: 9900, variants: [], tags: [], imageId: null, available: true })),
    }));
    return <PublicView page={{ ...base, menu: { categories: categories.map((c, k) => (k === 0 ? { ...c, items: c.items.map((i, n) => ({ ...i, featured: n === 0, available: n !== 2, variants: n === 1 ? [{ name: "Chica", priceCents: 9900 }, { name: "Grande", priceCents: 12900 }] : [] })) } : c)) } }} mode="live" />;
  }
  if (screen.startsWith("estilos-")) {
    // estilos-noche: algunas fotos (como una carta real); estilos-noche-sinfotos: ninguna.
    const [tpl, variant] = screen.replace("estilos-", "").split("-") as [TemplateId, string | undefined];
    const noPhotos = variant === "sinfotos";
    const base = demoPage(tpl);
    const photos: Record<string, string> = { i1: "guac", i3: "tinga", i6: "jamaica" };
    const categories = [
      ...base.menu.categories.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i, imageId: noPhotos ? null : (photos[i.id] ?? null), featured: i.id === "i1" || i.id === "i4" })) })),
      {
        id: "postres",
        name: "Postres",
        items: [
          { id: "p1", name: "Pan de elote", description: "Con cajeta y nuez.", priceCents: 7500, variants: [], tags: ["vegetariano"], imageId: noPhotos ? null : "pan", available: true },
          { id: "p2", name: "Flan napolitano", description: "", priceCents: 6500, variants: [], tags: [], imageId: null, available: true },
        ],
      },
    ];
    return (
      <div className="flex flex-wrap gap-6 bg-[#E9E7E2] p-6">
        {MENU_STYLES.map((m) => (
          <div key={m.id}>
            <p className="mb-2 text-center text-sm font-medium">{m.name}</p>
            <Phone>
              <DemoPhotosView page={{ ...base, theme: { ...base.theme, menuStyle: m.id }, menu: { categories } }} />
            </Phone>
          </div>
        ))}
      </div>
    );
  }
  if (screen.startsWith("publico-")) return <PublicView page={demoPage(screen.replace("publico-", "") as TemplateId)} mode="preview" />;
  const shell = (c: React.ReactNode) => (
    <AdminShell tenant={{ name: t.name, slug: t.slug, status: t.status }} readOnly={false} viewingAs={false} userEmail="dueno@ejemplo.mx">{c}</AdminShell>
  );
  if (screen === "carta") return shell(<MenuEditor tenant={t} initial={fakeDraft()} readOnly={false} />);
  if (screen === "carta-vacia") return shell(<MenuEditor tenant={t} initial={{ categories: {}, items: {}, itemCount: 0, updatedAt: "", updatedBy: "" }} readOnly={false} />);
  if (screen === "pagina") return shell(<PageEditor initial={t} draft={fakeDraft()} readOnly={false} hasCards={false} />);
  notFound();
}
