const THUMB_MAX = 128;

export async function generateThumbnailUrl(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file, {
      resizeWidth: THUMB_MAX,
      resizeHeight: THUMB_MAX,
      resizeQuality: "high",
    });

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return URL.createObjectURL(file);
    }

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );

    if (!blob) return URL.createObjectURL(file);
    return URL.createObjectURL(blob);
  } catch {
    return URL.createObjectURL(file);
  }
}
