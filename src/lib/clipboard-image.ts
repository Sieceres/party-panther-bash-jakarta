const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

/** Read an image from the clipboard (button click). Returns null if none. */
export async function readClipboardImage(): Promise<string | null> {
  if (!navigator.clipboard?.read) throw new Error("unsupported");
  const items = await navigator.clipboard.read();
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith("image/"));
    if (type) return toDataUrl(await item.getType(type));
  }
  return null;
}

/** Get an image from a paste event, if any. */
export async function imageFromPasteEvent(e: { clipboardData: DataTransfer | null }): Promise<string | null> {
  const items = e.clipboardData?.items;
  if (!items) return null;
  for (const item of Array.from(items)) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) return toDataUrl(file);
    }
  }
  return null;
}

export const hasPastedImage = (e: { clipboardData: DataTransfer | null }) =>
  Array.from(e.clipboardData?.items ?? []).some((i) => i.type.startsWith("image/"));
