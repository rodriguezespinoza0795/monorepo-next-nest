"use client";

import { useEffect, useRef, useState } from "react";
import {
  useClientConnectedUser,
  useFeedsClient,
} from "@stream-io/feeds-react-sdk";
import { PostComposer } from "@repo/ui/feed/post-composer";
import { createPost } from "./actions";
import { RequireFeedsClient } from "./require-feeds-client";
import { useMentions } from "./use-mentions";

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 5000;

interface ComposerImage {
  id: string;
  previewUrl: string;
  uploading: boolean;
  url?: string;
}

interface ConnectedPostComposerProps {
  /** Espacios donde el usuario puede publicar; el primero es el inicial. */
  spaces: { id: string; name: string }[];
  /** Se llama tras publicar con éxito. */
  onPosted?: () => void;
}

const Composer = ({ spaces, onPosted }: ConnectedPostComposerProps) => {
  const client = useFeedsClient();
  const user = useClientConnectedUser();
  const [text, setText] = useState("");
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? "");
  const [images, setImages] = useState<ComposerImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mentions = useMentions();

  // Libera las vistas previas locales al desmontar.
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(
    () => () =>
      imagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      ),
    [],
  );

  const updateImage = (id: string, patch: Partial<ComposerImage>) =>
    setImages((current) =>
      current.map((image) =>
        image.id === id ? { ...image, ...patch } : image,
      ),
    );

  const removeImage = (id: string) =>
    setImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) URL.revokeObjectURL(image.previewUrl);
      return current.filter((item) => item.id !== id);
    });

  const addImages = (files: File[]) => {
    if (!client) return;
    setError(null);
    const room = MAX_IMAGES - images.length;
    const valid = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= MAX_IMAGE_BYTES,
    );
    if (valid.length < files.length) {
      setError("Solo imágenes de hasta 10 MB.");
    }
    for (const file of valid.slice(0, room)) {
      const id = crypto.randomUUID();
      setImages((current) => [
        ...current,
        { id, previewUrl: URL.createObjectURL(file), uploading: true },
      ]);
      client
        .uploadImage({ file })
        .then(({ file: url }) => {
          if (!url) throw new Error("Respuesta sin URL");
          updateImage(id, { uploading: false, url });
        })
        .catch((uploadError: unknown) => {
          console.error("[stream] no se pudo subir la imagen", uploadError);
          removeImage(id);
          setError("No pudimos subir una imagen. Inténtalo de nuevo.");
        });
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const result = await createPost({
      spaceId,
      text,
      images: images.flatMap((image) => (image.url ? [image.url] : [])),
      mentionedUserIds: mentions.mentionedIds(text),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setImages([]);
    setText("");
    mentions.reset();
    onPosted?.();
  };

  if (!user || spaces.length === 0) return null;

  const current = spaces.find((space) => space.id === spaceId);

  return (
    <PostComposer
      user={{ name: user.name ?? user.id, image: user.image }}
      value={text}
      onChange={setText}
      onSubmit={submit}
      placeholder={
        current
          ? `Comparte algo en ${current.name}…`
          : "¿Qué quieres compartir?"
      }
      maxLength={MAX_TEXT_LENGTH}
      spaces={spaces}
      spaceId={spaceId}
      onSpaceChange={setSpaceId}
      images={images}
      maxImages={MAX_IMAGES}
      onAddImages={addImages}
      onRemoveImage={removeImage}
      submitting={submitting}
      error={error}
      mentionSuggestions={mentions.suggestions}
      onMentionQuery={mentions.onMentionQuery}
      onMention={mentions.onMention}
    />
  );
};

export const ConnectedPostComposer = (props: ConnectedPostComposerProps) => (
  <RequireFeedsClient>
    <Composer {...props} />
  </RequireFeedsClient>
);
