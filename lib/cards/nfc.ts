"use client";

// Web NFC solo existe en Chrome para Android.
interface NDEFRecordInit { recordType: string; data?: string }
interface NDEFReadingEvent extends Event { message: { records: { recordType: string; data?: DataView }[] } }
interface NDEFReaderLike {
  write(msg: { records: NDEFRecordInit[] }, opts?: { overwrite?: boolean; signal?: AbortSignal }): Promise<void>;
  scan(opts?: { signal?: AbortSignal }): Promise<void>;
  makeReadOnly(opts?: { signal?: AbortSignal }): Promise<void>;
  onreading: ((e: NDEFReadingEvent) => void) | null;
  onreadingerror: ((e: Event) => void) | null;
}

export const nfcSupported = () => typeof window !== "undefined" && "NDEFReader" in window;

function reader(): NDEFReaderLike {
  const Ctor = (window as unknown as { NDEFReader: new () => NDEFReaderLike }).NDEFReader;
  return new Ctor();
}

/** Graba la URL en la tarjeta (paso 1). */
export async function writeUrl(url: string, signal?: AbortSignal) {
  await reader().write({ records: [{ recordType: "url", data: url }] }, { overwrite: true, signal });
}

/** Lee la tarjeta y confirma que tiene la URL esperada (paso 2). */
export function verifyUrl(url: string, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const r = reader();
    r.onreading = (e) => {
      const rec = e.message.records.find((x) => x.recordType === "url");
      const read = rec?.data ? new TextDecoder().decode(rec.data) : "";
      resolve(read === url);
    };
    r.onreadingerror = () => reject(new Error("No se pudo leer la tarjeta. Acércala de nuevo."));
    r.scan({ signal }).catch(reject);
  });
}

/** Bloquea la tarjeta para siempre (paso 3). Ya no se puede volver a grabar. */
export async function lockTag(signal?: AbortSignal) {
  await reader().makeReadOnly({ signal });
}
