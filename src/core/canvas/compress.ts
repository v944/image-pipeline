interface CompressSettings {
  quality: number;
  method: "lossy" | "lossless";
}

export function applyCompress(
  source: HTMLCanvasElement,
  settings: CompressSettings
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const quality = Math.max(0, Math.min(1, settings.quality / 100));
    source.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Compression failed"));
      },
      "image/jpeg",
      quality
    );
  });
}
