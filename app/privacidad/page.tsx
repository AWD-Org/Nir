import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { TERMS_VERSION } from "@/lib/domain/constants";

export const metadata: Metadata = { title: "Aviso de privacidad", alternates: { canonical: "/privacidad" } };

export default function Page() {
  return (
    <LegalPage title="Aviso de privacidad" updated={TERMS_VERSION}>
      <p>
        AMOXTLI® (en adelante, &ldquo;AMOXTLI&rdquo;), con correo de contacto hello@amoxtli.tech, es responsable del tratamiento de los datos personales que se recaban a través de Nir (nir.amoxtli.tech), conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
      </p>
      <h2>Datos que tratamos de los dueños de negocio</h2>
      <ul>
        <li>Nombre, correo electrónico y proveedor de acceso (correo y contraseña o cuenta de Google).</li>
        <li>Datos del negocio que el dueño captura: nombre, dirección, teléfono, horario, redes, carta y fotos.</li>
        <li>Registro de pagos (concepto, monto, fecha, método y referencia).</li>
      </ul>
      <h2>Datos de los comensales</h2>
      <p>
        Nir no pide registro ni recaba nombre, teléfono, correo ni la dirección IP completa de quien abre la página de un negocio, y no usa cookies de rastreo. Solo se guardan contadores agregados: número de visitas por día, hora y mesa, el medio de llegada (NFC, QR o enlace) y los botones que se tocan.
      </p>
      <h2>Para qué usamos los datos</h2>
      <ul>
        <li>Crear y administrar la cuenta y la página del negocio.</li>
        <li>Producir, entregar y dar soporte a las tarjetas NFC.</li>
        <li>Registrar pagos y enviar recordatorios de cobro.</li>
        <li>Mostrar estadísticas de uso al dueño del negocio.</li>
      </ul>
      <h2>Con quién se comparten</h2>
      <p>
        Los datos se almacenan con proveedores de infraestructura (Google Firebase y Netlify) que actúan como encargados. No vendemos ni compartimos datos personales con terceros para fines comerciales.
      </p>
      <h2>Derechos ARCO</h2>
      <p>
        Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos, o revocar tu consentimiento, escribiendo a hello@amoxtli.tech con tu nombre, el correo de tu cuenta y la descripción de tu solicitud. Respondemos en un plazo máximo de 20 días hábiles.
      </p>
      <h2>Cambios a este aviso</h2>
      <p>Publicaremos cualquier cambio en esta página, con su nueva versión.</p>
    </LegalPage>
  );
}
