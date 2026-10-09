interface AttachmentLike {
  type?: string;
  image_url?: string;
  og_scrape_url?: string;
}

/**
 * Imagen subida por el autor. Cuando el texto tiene una URL, Stream agrega
 * su vista previa como adjunto (con `og_scrape_url`) y, si el sitio no tiene
 * `og:image`, la guarda como `type: "image"` con el favicon: no es una foto
 * del post.
 */
export const isUploadedImage = <T extends AttachmentLike>(
  attachment: T,
): attachment is T & { image_url: string } =>
  attachment.type === "image" &&
  Boolean(attachment.image_url) &&
  !attachment.og_scrape_url;

interface ScrapedAttachment extends AttachmentLike {
  title?: string;
  text?: string;
  author_name?: string;
  thumb_url?: string;
}

const MAX_PREVIEWS = 3;

// Miniaturas que no son una imagen real del enlace: favicons y `data:`.
const isRealImage = (url?: string): url is string =>
  Boolean(url) &&
  /^https:\/\//i.test(url as string) &&
  !/favicon|\.ico(\?|$)|data:/i.test(url as string);

/**
 * Vistas previas de enlaces que Stream agrega al leer las URLs del texto
 * (adjuntos con `og_scrape_url`). Solo enlaces web, sin repetidos, máx. 3,
 * en el orden en que aparecen en `text` (Stream no conserva ese orden).
 */
export const linkPreviewsOf = (
  attachments: ScrapedAttachment[] = [],
  text = "",
) => {
  const seen = new Set<string>();
  const position = (url: string) => {
    const index = text.indexOf(url.replace(/\/$/, ""));
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return attachments
    .filter(
      (
        attachment,
      ): attachment is ScrapedAttachment & { og_scrape_url: string } =>
        /^https?:\/\//i.test(attachment.og_scrape_url ?? ""),
    )
    .filter(
      ({ og_scrape_url: url }) => !seen.has(url) && Boolean(seen.add(url)),
    )
    .sort((a, b) => position(a.og_scrape_url) - position(b.og_scrape_url))
    .slice(0, MAX_PREVIEWS)
    .map((attachment) => {
      const image = [attachment.thumb_url, attachment.image_url].find(
        isRealImage,
      );
      return {
        url: attachment.og_scrape_url,
        title: attachment.title || undefined,
        description: attachment.text || undefined,
        site: attachment.author_name || undefined,
        image,
      };
    });
};
