const MIME_TYPES: Record<string, string> = {
  PNG: "image/png",
  JPEG: "image/jpeg",
  WebP: "image/webp",
  AVIF: "image/avif",
  GIF: "image/gif",
  BMP: "image/bmp",
};

export function getMimeType(format: string): string {
  return MIME_TYPES[format] || "image/png";
}

export function convertFormat(
  source: HTMLCanvasElement,
  targetFormat: string,
  quality: number = 85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = getMimeType(targetFormat);
    const q = mimeType === "image/png" ? undefined : Math.max(0, Math.min(1, quality / 100));
    source.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Format conversion to ${targetFormat} failed`));
      },
      mimeType,
      q
    );
  });
}

export function isFormatSupported(format: string): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const mimeType = getMimeType(format);
  return canvas.toDataURL(mimeType).includes(mimeType);
}
