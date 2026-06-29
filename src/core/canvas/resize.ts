interface ResizeSettings {
  width: number | null;
  height: number | null;
  mode: "fit" | "fill" | "stretch";
  keepAspectRatio: boolean;
}

export function applyResize(
  source: HTMLCanvasElement,
  settings: ResizeSettings
): HTMLCanvasElement {
  const srcW = source.width;
  const srcH = source.height;
  let dstW: number;
  let dstH: number;

  if (settings.mode === "stretch") {
    dstW = settings.width ?? srcW;
    dstH = settings.height ?? srcH;
  } else if (settings.width && settings.height) {
    const ratio = Math.min(
      settings.width / srcW,
      settings.height / srcH
    );
    if (settings.mode === "fill") {
      dstW = settings.width;
      dstH = settings.height;
    } else {
      dstW = Math.round(srcW * ratio);
      dstH = Math.round(srcH * ratio);
    }
  } else if (settings.width) {
    const ratio = settings.width / srcW;
    dstW = settings.width;
    dstH = settings.keepAspectRatio ? Math.round(srcH * ratio) : srcH;
  } else if (settings.height) {
    const ratio = settings.height / srcH;
    dstH = settings.height;
    dstW = settings.keepAspectRatio ? Math.round(srcW * ratio) : srcW;
  } else {
    dstW = srcW;
    dstH = srcH;
  }

  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, dstW, dstH);
  return canvas;
}
