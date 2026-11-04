import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { TERMS_VERSION } from "@/lib/domain/constants";

export const metadata: Metadata = { title: "Términos de servicio", alternates: { canonical: "/terminos" } };

export default function Page() {
  return (
    <LegalPage title="Términos de servicio" updated={TERMS_VERSION}>
      <p>Estos términos regulan el uso de Nir, servicio de AMOXTLI® para restaurantes, bares y cafeterías. Al crear una cuenta, el dueño del negocio los acepta.</p>
      <h2>El servicio</h2>
      <ul>
        <li>Una página del negocio en nir.amoxtli.tech con carta, enlace de reseñas, redes y Wi-Fi.</li>
        <li>Una app de administración para editar esa página.</li>
        <li>Tarjetas NFC con QR por mesa, programadas, impresas e instaladas por AMOXTLI®.</li>
      </ul>
      <h2>Cuentas</h2>
      <ul>
        <li>Cada cuenta corresponde a un solo negocio con una sola carta. Un dueño con varios negocios necesita una cuenta por negocio.</li>
        <li>Toda cuenta empieza en vista previa. La página se publica cuando AMOXTLI® la activa, después del pago del alta.</li>
        <li>El dueño es responsable de la información de su carta, incluidos precios y descripciones.</li>
      </ul>
      <h2>Tarjetas</h2>
      <ul>
        <li>Las tarjetas se graban una sola vez con la dirección del negocio y pertenecen a ese negocio.</li>
        <li>El alta incluye un número limitado de tarjetas; las adicionales y las reposiciones se cobran aparte.</li>
      </ul>
      <h2>Pagos</h2>
      <ul>
        <li>El alta se paga en la primera visita. La mensualidad empieza el día de entrega de las tarjetas y el primer cobro es un mes después; la anualidad, si se elige, se paga en la primera visita.</li>
        <li>Los pagos se hacen por transferencia o liga de pago.</li>
        <li>Si un pago no se cubre, la cuenta pasa a gracia por 7 días y después se suspende: la página deja de mostrarse y el admin queda en solo lectura. La información no se borra al suspender y se reactiva al registrar el pago. Tras 90 días suspendida, la cuenta se cancela.</li>
      </ul>
      <h2>Reseñas</h2>
      <p>El botón de reseña se muestra igual a todos los comensales. Nir no filtra ni pide reseñas solo a clientes satisfechos.</p>
      <h2>Contacto</h2>
      <p>Para dudas sobre estos términos escribe a hello@amoxtli.tech.</p>
    </LegalPage>
  );
}
