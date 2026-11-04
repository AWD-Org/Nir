# PRODUCT.md — AMOXTLI Nir

Fuente: PRD interno v1.3 (03/11/2026) y documento "Tecnologías e infraestructura". Este archivo resume lo durable del producto para cualquier persona o agente que trabaje en el repo.

## Qué es
Una tarjeta NFC con QR de respaldo en cada mesa de un restaurante, bar o cafetería. Con un toque, el comensal abre la página del negocio, tipo Linktree, con cuatro accesos: **Carta**, **Déjanos tu reseña** (Google), **Redes sociales** y **Wi-Fi**. El dueño administra todo desde una app protegida.

Dominio: `nir.amoxtli.tech`. Producto propio de AMOXTLI®, de la misma familia que Space.

## Para quién
| Persona | Contexto de uso | Qué necesita |
|---|---|---|
| Dueño del negocio | En el celular, entre servicios, con poco tiempo y poca paciencia para herramientas | Cambiar un precio o marcar un agotado en menos de 30 s y confiar en que el cambio ya se ve |
| Comensal | Sentado a la mesa, con una mano y poca atención | Ver la carta rápido, dejar una reseña, encontrar el Wi-Fi |
| Vendedor / soporte AMOXTLI® | En la visita de venta (40 min) y en la oficina | Crear la cuenta con el dueño, cobrar, activar, producir y grabar tarjetas |

## Reglas que el código hace cumplir
- Una cuenta por dueño, un negocio por cuenta, una carta por negocio (`owners/{uid}` como candado, en transacción del servidor).
- Toda cuenta nace en **vista previa**: el dueño arma su página, pero `/{slug}` responde "Menú no disponible" y no hay descarga de QR hasta que AMOXTLI® la activa.
- Las tarjetas se graban una sola vez con `nir.amoxtli.tech/{slug}/{mesa}-{sufijo}`. El slug queda fijo desde que hay tarjetas; si cambia, el anterior redirige.
- El botón de reseña se muestra igual a todos (Google prohíbe filtrar reseñas).
- Las estadísticas no guardan datos personales del comensal.
- Estados: `preview → active → due (5 días antes) → grace (7 días) → suspended → cancelled (90 días)`.

## Voz
Español de México, directo y cercano. Se habla de lo que pasa en el negocio ("tu carta", "tus mesas"), no de tecnología. Botones con la acción y el resultado ("Guardar precio", "Pide tu kit Nir"), nunca "Enviar".

## Fuera de esta etapa
Llamar mesero, pedir la cuenta, comentario privado, promociones, lealtad, pedidos, pagos en mesa, CFDI, varios negocios por cuenta, cobro dentro de la app, idiomas extra.

## Evidencia
Aún no hay datos de uso. El piloto es La Penka del Haragán (CDMX). Ninguna cifra, reseña o testimonio debe aparecer en la landing hasta tener datos reales.
