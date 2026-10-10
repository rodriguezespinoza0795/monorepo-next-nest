import type { Metadata } from "next";
import { LegalDocument } from "@repo/ui/legal-document";
import { SiteFooter } from "@repo/ui/site-footer";
import { SiteHeader } from "@repo/ui/site-header";
import { LEGAL } from "../../lib/legal";
import { BRAND } from "@repo/community/brand";

export const metadata: Metadata = {
  title: `Política de privacidad · ${LEGAL.appName}`,
};

const { appName, owner, contactEmail } = LEGAL;

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader
        brand={appName}
        action={{ label: "Acceder", href: "/login" }}
      />
      <LegalDocument
        title="Política de privacidad"
        updated={LEGAL.updated}
        contactEmail={contactEmail}
        intro={
          <p>
            Esta política explica qué datos recopila {appName}, una comunidad en
            línea operada por {owner}, para qué los usa, con quién los comparte
            y qué puedes hacer con ellos. Recopilamos solo lo necesario para que
            la comunidad funcione: no mostramos publicidad ni vendemos datos.
          </p>
        }
        sections={[
          {
            title: "Datos que recopilamos",
            content: (
              <>
                <p>
                  <strong>De tu cuenta de Google</strong>, al iniciar sesión: tu
                  nombre, tu correo electrónico, tu foto de perfil y el
                  identificador de tu cuenta de Google (lo usamos para
                  reconocerte en cada inicio de sesión). No accedemos a tu
                  contraseña, a tus contactos ni a ningún otro dato de Google.
                </p>
                <p>
                  <strong>Lo que creas en la comunidad:</strong> publicaciones
                  (texto e imágenes), comentarios y respuestas, reacciones de
                  “me gusta”, menciones, los espacios a los que te unes y las
                  notificaciones que recibes.
                </p>
                <p>
                  <strong>Datos técnicos:</strong> cookies de sesión (ver la
                  sección 7), contadores temporales para limitar la frecuencia
                  de publicaciones y comentarios, y los registros técnicos que
                  genera nuestro proveedor de hospedaje (por ejemplo, la
                  dirección IP y la fecha de cada petición).
                </p>
              </>
            ),
          },
          {
            title: "Para qué los usamos",
            content: (
              <ul>
                <li>Identificarte y mantener tu sesión iniciada.</li>
                <li>
                  Mostrar tu perfil, tus publicaciones y tus comentarios a los
                  demás miembros, y avisarte cuando alguien comenta, reacciona o
                  te menciona.
                </li>
                <li>
                  Moderar la comunidad: el equipo puede revisar y eliminar
                  contenido, y suspender cuentas que no respeten las
                  condiciones.
                </li>
                <li>
                  Prevenir abusos, como el envío masivo de publicaciones o
                  comentarios.
                </li>
                <li>
                  Diagnosticar errores y mantener el servicio funcionando.
                </li>
              </ul>
            ),
          },
          {
            title: "Quién ve tus datos",
            content: (
              <>
                <p>
                  <strong>Otros miembros:</strong> tu nombre, tu foto, tus
                  publicaciones, comentarios y reacciones son visibles para las
                  personas que inician sesión en la comunidad. Tu correo
                  electrónico no se muestra a otros miembros.
                </p>
                <p>
                  <strong>Proveedores que nos prestan servicio</strong>, solo
                  para operar {appName}:
                </p>
                <ul>
                  <li>
                    <strong>Google</strong>, para el inicio de sesión.
                  </li>
                  <li>
                    <strong>Stream (GetStream)</strong>, que almacena perfiles,
                    publicaciones, comentarios, reacciones y notificaciones.
                  </li>
                  <li>
                    <strong>Vercel</strong>, que hospeda la aplicación.
                  </li>
                  <li>
                    <strong>Upstash</strong>, que guarda los contadores
                    temporales del límite de frecuencia.
                  </li>
                  <li>
                    <strong>Sentry</strong>, que registra los errores técnicos
                    de la aplicación para poder corregirlos: el mensaje del
                    error, la página, el navegador y tu identificador interno
                    (no tu nombre, correo ni dirección IP).
                  </li>
                </ul>
                <p>
                  Estos proveedores pueden procesar datos fuera de tu país. No
                  vendemos ni compartimos tus datos con nadie más, salvo que una
                  ley o una autoridad competente lo exija.
                </p>
              </>
            ),
          },
          {
            title: "Cuánto tiempo los conservamos",
            content: (
              <ul>
                <li>
                  Tu perfil y tu contenido, mientras tu cuenta esté activa o
                  hasta que solicites su eliminación. Al ser una demo, podemos
                  borrar todo el contenido en cualquier momento (por ejemplo, al
                  reiniciarla).
                </li>
                <li>
                  Las publicaciones que eliminas dejan de mostrarse de
                  inmediato, pero se conservan ocultas para que el equipo pueda
                  revisarlas o restaurarlas por un error de moderación; puedes
                  pedir que se borren definitivamente.
                </li>
                <li>
                  Las cookies de sesión, hasta 7 días sin usar la comunidad.
                </li>
                <li>Los contadores del límite de frecuencia, 10 minutos.</li>
              </ul>
            ),
          },
          {
            title: "Seguridad",
            content: (
              <p>
                Todo el tráfico viaja cifrado (HTTPS) y la sesión se guarda en
                cookies cifradas. Las acciones que modifican contenido se
                validan en nuestros servidores, y el acceso a los datos está
                limitado a lo que cada función necesita. Ningún sistema es
                completamente seguro: si detectamos un incidente que afecte tus
                datos, te lo comunicaremos.
              </p>
            ),
          },
          {
            title: "Tus derechos",
            content: (
              <>
                <p>Puedes pedirnos en cualquier momento:</p>
                <ul>
                  <li>Una copia de los datos que tenemos sobre ti.</li>
                  <li>
                    Corregirlos (tu nombre y tu foto se toman de tu cuenta de
                    Google).
                  </li>
                  <li>Eliminar tu cuenta y todo tu contenido.</li>
                  <li>Oponerte a algún uso concreto de tus datos.</li>
                </ul>
                <p>
                  Escríbenos a {contactEmail} desde el correo de tu cuenta y te
                  responderemos en un plazo máximo de 30 días. También puedes
                  revocar el acceso de {appName} desde la configuración de
                  seguridad de tu cuenta de Google.
                </p>
              </>
            ),
          },
          {
            title: "Cookies",
            content: (
              <p>
                Usamos solo cookies técnicas imprescindibles: las de tu sesión y
                las que protegen el inicio de sesión con Google. No usamos
                cookies de publicidad ni de analítica de terceros, por lo que no
                necesitamos tu consentimiento para ellas; si las bloqueas, no
                podrás iniciar sesión.
              </p>
            ),
          },
          {
            title: "Menores de edad",
            content: (
              <p>
                {appName} no está dirigida a menores de 13 años (o de la edad
                mínima que exija la ley de tu país). Si sabemos que una cuenta
                pertenece a un menor, la eliminaremos.
              </p>
            ),
          },
          {
            title: "Cambios en esta política",
            content: (
              <p>
                Si cambiamos esta política actualizaremos la fecha de arriba y,
                si el cambio es importante, lo anunciaremos en la comunidad
                antes de que entre en vigor.
              </p>
            ),
          },
        ]}
      />
      <SiteFooter
        brand={appName}
        note={BRAND.demoNote}
        links={[
          { label: "Privacidad", href: "/privacy" },
          { label: "Condiciones", href: "/terms" },
        ]}
      />
    </>
  );
}
