import { expect, test, type Page } from "@playwright/test";

// Recorre la visita 1 completa: registro del dueño, negocio, carta, activación por AMOXTLI®,
// tarjetas, toque NFC/QR, tarjeta desactivada y estadísticas.
const SHOTS = "test-results/capturas";
const OWNER = { email: `dueno-${Date.now()}@nir.test`, password: "nir-prueba-2026" };
const STAFF = { email: "superadmin@nir.test", password: "nir-prueba-2026" };
const NAME = "Taquería E2E";
const SLUG = "taqueria-e2e";

async function shot(page: Page, name: string, widths = [1440, 390]) {
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${SHOTS}/${name}-${w}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

async function logout(page: Page) {
  await page.request.delete("/api/session");
  await page.context().clearCookies();
  await page.goto("/entrar");
  await page.evaluate(() => indexedDB.deleteDatabase("firebaseLocalStorageDb"));
}

async function login(page: Page, who: { email: string; password: string }) {
  await page.goto("/entrar");
  await page.getByLabel("Correo").fill(who.email);
  await page.getByLabel("Contraseña").fill(who.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

test.describe.configure({ mode: "serial" });

test("visita 1 completa y toque de tarjeta", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("a un toque");
  await shot(page, "landing");

  // Registro (RF02, RF04)
  await page.goto("/registro");
  await page.getByLabel("Tu nombre").fill("Dueño E2E");
  await page.getByLabel("Correo").fill(OWNER.email);
  await page.getByLabel("Contraseña").fill(OWNER.password);
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page.getByRole("alert")).toContainText("Acepta los términos");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page).toHaveURL(/\/admin\/bienvenida/);

  // Asistente (RF06)
  await page.getByLabel("Nombre del negocio").fill(NAME);
  await expect(page.getByLabel("Dirección de tu página")).toHaveValue(SLUG);
  await expect(page.getByText("Disponible")).toBeVisible();
  await shot(page, "bienvenida");
  await page.getByRole("button", { name: "Crear mi negocio" }).click();
  await expect(page.getByRole("heading", { name: "Sube tu logo" })).toBeVisible();
  await page.getByRole("button", { name: "Después" }).click();
  await page.getByRole("button", { name: "Después" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Tu página está en vista previa")).toBeVisible();
  await shot(page, "admin-inicio");

  // Un negocio por cuenta (RF05)
  await page.goto("/admin/bienvenida");
  await expect(page).toHaveURL(/\/admin$/);

  // Carta (RF08, RF09, RF13, RF14)
  await page.goto("/admin/carta");
  await page.getByRole("button", { name: /Agregar 4 categorías/ }).click();
  await expect(page.getByRole("heading", { name: "Entradas" })).toBeVisible();
  await page.getByRole("button", { name: "Agregar producto" }).first().click();
  await page.getByLabel("Nombre", { exact: true }).fill("Tacos al pastor");
  await page.getByLabel("Precio", { exact: true }).fill("22");
  await page.locator('button[form="item-form"]').click();
  await expect(page.getByText("Producto agregado")).toBeVisible();
  await page.getByRole("button", { name: "Agregar producto" }).first().click();
  await page.getByLabel("Nombre", { exact: true }).fill("Gringa");
  await page.getByLabel("Precio", { exact: true }).fill("65");
  await page.locator('button[form="item-form"]').click();
  await expect(page.getByText("Producto agregado").first()).toBeVisible();

  const price = page.getByLabel("Precio de Tacos al pastor");
  await price.fill("25");
  await price.press("Enter");
  await expect(page.getByText("Precio guardado")).toBeVisible();
  await page.getByRole("switch", { name: "Gringa disponible" }).click();
  await expect(page.getByText("Marcado como agotado")).toBeVisible();
  await shot(page, "admin-carta");

  // Página (RF16, RF17)
  await page.goto("/admin/pagina");
  await page.getByLabel("Enlace para reseñas de Google").fill("https://evil.com/review");
  await page.locator("#enlaces").getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText(/enlace que da Google/)).toBeVisible();
  await page.getByLabel("Enlace para reseñas de Google").fill("https://g.page/r/taqueria-e2e/review");
  await page.locator("#l-instagram").fill("@taqueriae2e");
  await page.locator("#enlaces").getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Guardado y publicado")).toBeVisible();
  await shot(page, "admin-pagina");

  // Vista previa privada (RNF12)
  await page.goto(`/${SLUG}`);
  await expect(page.getByRole("heading", { name: "Menú no disponible" })).toBeVisible();

  // Consola: pago del alta, activación y tarjetas (RF39, RF40, RF32)
  await logout(page);
  await login(page, STAFF);
  await expect(page).toHaveURL(/\/console/);
  await page.getByRole("link", { name: NAME }).click();
  await expect(page.getByRole("button", { name: "Activar cuenta" })).toBeDisabled();
  await page.getByLabel("Monto (MXN)").fill("1490");
  await page.getByLabel("Folio o referencia").fill("SPEI-E2E");
  await page.getByRole("button", { name: "Registrar pago" }).click();
  await expect(page.getByText("Pago registrado")).toBeVisible();
  await page.getByRole("button", { name: "Activar cuenta" }).click();
  await expect(page.getByText("Cuenta activada")).toBeVisible();
  await page.getByLabel("Mesas").fill("3");
  await page.getByRole("button", { name: "Generar tarjetas" }).click();
  await expect(page.getByText("Tarjetas generadas")).toBeVisible();
  const urlCell = page.getByRole("cell", { name: new RegExp(`/${SLUG}/1-`) });
  await expect(urlCell).toBeVisible();
  const card1 = (await urlCell.textContent())!.replace(/^[^/]+/, "");
  const card2 = (await page.getByRole("cell", { name: new RegExp(`/${SLUG}/2-`) }).textContent())!.replace(/^[^/]+/, "");
  await shot(page, "console-negocio");

  // Página pública (RF25–RF28, RF31)
  await page.goto(`/${SLUG}`);
  await expect(page.getByRole("heading", { name: NAME })).toBeVisible();
  await expect(page.getByRole("link", { name: /Déjanos tu reseña/ })).toHaveAttribute("href", /g\.page/);
  await shot(page, "publica-inicio", [390]);
  await page.getByRole("button", { name: /Carta/ }).click();
  await expect(page.getByText("Tacos al pastor")).toBeVisible();
  await expect(page.getByText("$25")).toBeVisible();
  await expect(page.getByText("Agotado")).toBeVisible();
  await shot(page, "publica-carta", [390]);

  // Toque de tarjeta NFC y QR (RF35, RNF09)
  await page.goto(card1);
  await expect(page).toHaveURL(new RegExp(`/${SLUG}$`));
  await page.goto(`${card1}?s=qr`);
  await expect(page).toHaveURL(new RegExp(`/${SLUG}$`));

  // Tarjeta desactivada (RF36)
  await page.goto("/console");
  await page.getByRole("link", { name: NAME }).click();
  await page.getByRole("row", { name: new RegExp(`/${SLUG}/2-`) }).getByTitle("Desactivar").click();
  await page.getByRole("button", { name: "Desactivar", exact: true }).click();
  await expect(page.getByText("Tarjeta desactivada")).toBeVisible();
  await page.goto(card2);
  await expect(page).toHaveURL(/\/no-disponible/);

  // Por vencer y auditoría (RF42, RF44)
  await page.goto("/console/auditoria");
  await expect(page.getByText("activate").first()).toBeVisible();
  await expect(page.getByText("payment.create").first()).toBeVisible();

  // Estadísticas del dueño (RF24)
  await logout(page);
  await login(page, OWNER);
  await expect(page).toHaveURL(/\/admin/);
  await page.goto("/admin/estadisticas");
  await expect(page.getByText("Por tarjeta (NFC + QR)").locator("..")).toContainText("2");
  await shot(page, "admin-estadisticas");

  // Suspensión: la página deja de mostrarse sin perder datos (RF39)
  await logout(page);
  await login(page, STAFF);
  await page.getByRole("link", { name: NAME }).click();
  await page.getByRole("button", { name: "Suspender" }).click();
  await page.getByRole("button", { name: "Suspender", exact: true }).last().click();
  await expect(page.getByText("Cuenta suspendida")).toBeVisible();
  await page.goto(`/${SLUG}`);
  await expect(page.getByRole("heading", { name: "Menú no disponible" })).toBeVisible();
});
