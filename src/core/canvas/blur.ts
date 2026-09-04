function buildGaussianKernel(radius: number): Float32Array {
  const size = radius * 2 + 1;
  const kernel = new Float32Array(size * size);
  const sigma = radius / 3;
  const twoSigmaSq = 2 * sigma * sigma;
  let sum = 0;

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const val = Math.exp(-(x * x + y * y) / twoSigmaSq);
      kernel[(y + radius) * size + (x + radius)] = val;
      sum += val;
    }
  }

  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }

  return kernel;
}

export function applyBlur(
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

  const radius = Math.round((value / 100) * 20) + 1;
  const kernel = buildGaussianKernel(radius);
  const kSize = radius * 2 + 1;

  const dst = new Uint8ClampedArray(src.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const sx = Math.max(0, Math.min(w - 1, x + kx));
          const sy = Math.max(0, Math.min(h - 1, y + ky));
          const si = (sy * w + sx) * 4;
          const weight = kernel[(ky + radius) * kSize + (kx + radius)];

          r += src[si] * weight;
          g += src[si + 1] * weight;
          b += src[si + 2] * weight;
          a += src[si + 3] * weight;
        }
      }

      const di = (y * w + x) * 4;
      dst[di] = r;
      dst[di + 1] = g;
      dst[di + 2] = b;
      dst[di + 3] = a;
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
