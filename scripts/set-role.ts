/**
 * Asigna un rol de AMOXTLI® a un usuario existente.
 *   npm run set-role -- correo@amoxtli.tech superadmin
 *   npm run set-role -- vendedor@amoxtli.tech seller
 * El usuario debe cerrar sesión y volver a entrar para que el rol aplique.
 */
import { admin } from "./_admin";

const [email, role] = process.argv.slice(2);
if (!email || !["seller", "superadmin", "owner"].includes(role)) {
  console.error("Uso: npm run set-role -- <correo> <seller|superadmin|owner>");
  process.exit(1);
}

const { auth, db } = admin();
const user = await auth.getUserByEmail(email);
const owner = await db.collection("owners").doc(user.uid).get();
if (role !== "owner" && owner.exists) {
  console.error("Esta cuenta ya tiene un negocio; usa otro correo para el equipo de AMOXTLI®.");
  process.exit(1);
}
await auth.setCustomUserClaims(user.uid, role === "owner" ? { role, tenantId: owner.data()?.tenantId } : { role });
await db.collection("users").doc(user.uid).set({ role, email }, { merge: true });
await auth.revokeRefreshTokens(user.uid);
console.log(`Listo: ${email} ahora es ${role}. Debe volver a iniciar sesión.`);
