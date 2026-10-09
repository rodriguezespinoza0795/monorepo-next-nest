import type { Metadata } from "next";
import Link from "@mui/material/Link";
import { LegalDocument } from "@repo/ui/legal-document";
import { SiteFooter } from "@repo/ui/site-footer";
import { SiteHeader } from "@repo/ui/site-header";
import { LEGAL } from "../../lib/legal";
import { BRAND } from "@repo/community/brand";

export const metadata: Metadata = {
  title: `Condiciones de uso · ${LEGAL.appName}`,
};

const { appName, owner, contactEmail, country } = LEGAL;

export default function TermsPage() {
  return (
    <>
      <SiteHeader
        brand={appName}
        action={{ label: "Acceder", href: "/login" }}
      />
      <LegalDocument
        title="Condiciones de uso"
        updated={LEGAL.updated}
        contactEmail={contactEmail}
        intro={
          <p>
            Estas condiciones regulan el uso de {appName}, una comunidad en
            línea operada por {owner}. Al iniciar sesión aceptas estas
            condiciones y la <Link href="/privacy">política de privacidad</Link>
            .
          </p>
        }
        sections={[
          {
            title: "El servicio",
            content: (
              <p>
                {appName} es una comunidad donde los miembros se organizan en
                espacios, publican texto e imágenes, comentan, reaccionan, se
                mencionan y reciben notificaciones. Es un{" "}
                <strong>proyecto de demostración</strong> construido con Stream
                Activity Feeds: es gratuito, puede cambiar o dejar de estar
                disponible, y{" "}
                <strong>
                  el contenido puede borrarse en cualquier momento
                </strong>
                , por ejemplo al reiniciar la demo. No publiques nada que no
                quieras perder.
              </p>
            ),
          },
          {
            title: "Tu cuenta",
            content: (
              <ul>
                <li>
                  Inicias sesión con tu cuenta de Google; eres responsable de lo
                  que se haga desde ella.
                </li>
                <li>
                  Debes tener al menos 13 años (o la edad mínima que exija la
                  ley de tu país).
                </li>
                <li>
                  Una persona, una cuenta. No te hagas pasar por otra persona.
                </li>
              </ul>
            ),
          },
          {
            title: "Tu contenido",
            content: (
              <>
                <p>
                  Lo que publicas sigue siendo tuyo. Nos das permiso para
                  almacenarlo y mostrarlo a los miembros de la comunidad
                  mientras esté publicado; ese permiso termina cuando lo
                  eliminas, salvo la copia oculta que conservamos para
                  moderación (ver la política de privacidad).
                </p>
                <p>
                  Eres responsable de lo que publicas y de tener derecho a
                  publicarlo, incluidas las imágenes.
                </p>
              </>
            ),
          },
          {
            title: "Uso aceptable",
            content: (
              <>
                <p>No está permitido:</p>
                <ul>
                  <li>Acosar, amenazar, discriminar o incitar al odio.</li>
                  <li>
                    Publicar contenido ilegal, sexual explícito, violento o que
                    infrinja derechos de terceros.
                  </li>
                  <li>
                    Enviar spam, publicidad no solicitada o enlaces engañosos.
                  </li>
                  <li>
                    Publicar datos personales de otras personas sin su
                    consentimiento.
                  </li>
                  <li>
                    Automatizar el uso del servicio, extraer datos de forma
                    masiva o intentar saltarse sus límites o sus medidas de
                    seguridad.
                  </li>
                </ul>
              </>
            ),
          },
          {
            title: "Moderación",
            content: (
              <p>
                El equipo de {appName} puede eliminar contenido y suspender o
                bloquear cuentas que incumplan estas condiciones, con o sin
                aviso previo. Si crees que una decisión de moderación es un
                error, escríbenos a {contactEmail}.
              </p>
            ),
          },
          {
            title: "Notificaciones",
            content: (
              <p>
                Dentro de la comunidad recibirás avisos cuando alguien comente o
                reaccione a tu contenido, responda a tus comentarios o te
                mencione. No enviamos correos de publicidad.
              </p>
            ),
          },
          {
            title: "Disponibilidad y garantías",
            content: (
              <p>
                Ofrecemos el servicio “tal cual” y “según disponibilidad”. Nos
                esforzamos por mantenerlo funcionando, pero no garantizamos que
                esté libre de errores o interrupciones, ni que el contenido
                publicado por los miembros sea exacto.
              </p>
            ),
          },
          {
            title: "Limitación de responsabilidad",
            content: (
              <p>
                En la medida que permita la ley, {owner} no responde por daños
                indirectos ni por el contenido que publican los miembros. Nada
                en estas condiciones limita los derechos que te reconozca la ley
                como consumidor.
              </p>
            ),
          },
          {
            title: "Baja",
            content: (
              <p>
                Puedes dejar de usar {appName} cuando quieras y pedir la
                eliminación de tu cuenta escribiendo a {contactEmail}. También
                podemos dar de baja el servicio avisando con antelación
                razonable.
              </p>
            ),
          },
          {
            title: "Cambios y ley aplicable",
            content: (
              <p>
                Si cambiamos estas condiciones actualizaremos la fecha de arriba
                y anunciaremos los cambios importantes en la comunidad. Estas
                condiciones se rigen por las leyes de {country}.
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
