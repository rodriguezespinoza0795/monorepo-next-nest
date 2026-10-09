// "· editado": marca propia en `custom`, que solo ponen las acciones de
// editar. El `edited_at` de Stream no sirve: también cambia cuando Stream
// genera la vista previa de un enlace del texto.
export const EDITED_AT = "edited_at";

export const isEdited = (item: { custom?: Record<string, unknown> }) =>
  typeof item.custom?.[EDITED_AT] === "string";
