"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/media/compress";
import { uploadImage } from "@/app/admin/actions";

export function ImagePicker({
  kind,
  imageId,
  onChange,
  label,
  aspect = "square",
  disabled,
  onRemove,
}: {
  kind: "logo" | "cover" | "item";
  imageId: string | null;
  onChange: (id: string) => void;
  label: string;
  aspect?: "square" | "wide";
  disabled?: boolean;
  onRemove?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState<string | null>(null);

  async function onFile(file: File) {
    setBusy(true);
    try {
      const { full, thumb } = await compressImage(file, { square: kind !== "cover" });
      setLocal(URL.createObjectURL(thumb));
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("full", full, "full.webp");
      fd.set("thumb", thumb, "thumb.webp");
      const r = await uploadImage(fd);
      if (!r.ok) throw new Error(r.error);
      onChange(r.data!.imageId);
      toast.success(kind === "item" ? "Foto lista" : "Imagen guardada");
    } catch (e) {
      setLocal(null);
      toast.error(e instanceof Error ? e.message : "No pudimos subir la imagen.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const src = local ?? (imageId ? `/img/${imageId}/${aspect === "wide" ? "full" : "thumb"}` : null);
  const box = aspect === "wide" ? "aspect-[16/9] w-full" : "h-28 w-28";

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-end gap-3">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
          className={`${box} group relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line-2 bg-paper text-ink-2 transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed`}
          aria-label={src ? `Cambiar ${label.toLowerCase()}` : `Subir ${label.toLowerCase()}`}
        >
          {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6" />}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-ink" />
            </span>
          )}
        </button>
        {src && onRemove && !disabled && (
          <button type="button" className="btn-ghost min-h-10 px-3 text-sm" onClick={() => { setLocal(null); onRemove(); }}>
            <Trash2 className="h-4 w-4" /> Quitar
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}
