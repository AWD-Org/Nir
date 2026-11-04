import { AdminShell } from "@/components/admin/shell";
import { Toaster } from "@/components/ui/toaster";
import { requireOwner } from "@/lib/server/session";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { tenant, readOnly, viewingAs, session } = await requireOwner();
  return (
    <AdminShell
      tenant={{ name: tenant.name, slug: tenant.slug, status: tenant.status }}
      readOnly={readOnly}
      viewingAs={viewingAs}
      userEmail={session.email}
    >
      {children}
      <Toaster />
    </AdminShell>
  );
}
