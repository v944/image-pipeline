interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: "px" | "percent";
}

export function applyCrop(
  source: HTMLCanvasElement,
  settings: CropSettings
): HTMLCanvasElement {
  let cropX = settings.x;
  let cropY = settings.y;
  let cropW = settings.width;
  let cropH = settings.height;

  if (settings.unit === "percent") {
    cropX = Math.round((settings.x / 100) * source.width);
    cropY = Math.round((settings.y / 100) * source.height);
    cropW = Math.round((settings.width / 100) * source.width);
    cropH = Math.round((settings.height / 100) * source.height);
  }

  cropX = Math.max(0, cropX);
  cropY = Math.max(0, cropY);
  cropW = Math.min(cropW, source.width - cropX);
  cropH = Math.min(cropH, source.height - cropY);

  if (cropW < 1 || cropH < 1) {
    throw new Error("Crop region is empty (zero width or height)");
  }

  const canvas = document.createElement("canvas");
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return canvas;
}
