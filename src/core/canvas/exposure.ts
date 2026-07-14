export function applyExposure(
  source: HTMLCanvasElement,
  settings: { value: number }
): HTMLCanvasElement {
  const value = Math.max(-5, Math.min(5, settings.value ?? 0));

  if (value === 0) {
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    ctx.drawImage(source, 0, 0);
    return canvas;
  }

  const ctx = source.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  const w = source.width;
  const h = source.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const factor = Math.pow(2, value);

  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.min(255, Math.max(0, data[i] * factor));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor));
  }

  const output = new ImageData(data, w, h);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const outCtx = canvas.getContext("2d");
  if (!outCtx) throw new Error("Failed to get output canvas context");
  outCtx.putImageData(output, 0, 0);
  return canvas;
}
