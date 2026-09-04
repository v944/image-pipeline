export function applyTemperature(
  source: HTMLCanvasElement,
  settings: { value: number }
): HTMLCanvasElement {
  const value = Math.max(-100, Math.min(100, settings.value ?? 0));

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

  const rDelta = (value / 100) * 40;
  const bDelta = -(value / 100) * 40;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + rDelta));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + bDelta));
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
