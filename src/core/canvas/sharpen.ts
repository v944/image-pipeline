export function applySharpen(
  source: HTMLCanvasElement,
  settings: { value: number }
): HTMLCanvasElement {
  const value = Math.max(0, Math.min(100, settings.value ?? 0));

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
  const src = imageData.data;

  const amount = value / 100;
  const kernel = new Float32Array([
     0, -1,  0,
    -1,  4, -1,
     0, -1,  0,
  ]);

  const dst = new Uint8ClampedArray(src.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const sx = Math.max(0, Math.min(w - 1, x + kx));
          const sy = Math.max(0, Math.min(h - 1, y + ky));
          const si = (sy * w + sx) * 4;
          const weight = kernel[(ky + 1) * 3 + (kx + 1)];

          r += src[si] * weight;
          g += src[si + 1] * weight;
          b += src[si + 2] * weight;
        }
      }

      const di = (y * w + x) * 4;
      dst[di] = Math.min(255, Math.max(0, src[di] + r * amount));
      dst[di + 1] = Math.min(255, Math.max(0, src[di + 1] + g * amount));
      dst[di + 2] = Math.min(255, Math.max(0, src[di + 2] + b * amount));
      dst[di + 3] = src[di + 3];
    }
  }

  const output = new ImageData(dst, w, h);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const outCtx = canvas.getContext("2d");
  if (!outCtx) throw new Error("Failed to get output canvas context");
  outCtx.putImageData(output, 0, 0);
  return canvas;
}
