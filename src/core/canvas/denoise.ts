function getPixel(data: Uint8ClampedArray, x: number, y: number, w: number): number[] {
  const i = (y * w + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function medianFilter(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r: number[] = [];
      const g: number[] = [];
      const b: number[] = [];
      const a: number[] = [];

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const sx = Math.max(0, Math.min(w - 1, x + kx));
          const sy = Math.max(0, Math.min(h - 1, y + ky));
          const p = getPixel(src, sx, sy, w);
          r.push(p[0]);
          g.push(p[1]);
          b.push(p[2]);
          a.push(p[3]);
        }
      }

      r.sort((a, b) => a - b);
      g.sort((a, b) => a - b);
      b.sort((a, b) => a - b);
      a.sort((a, b) => a - b);

      const mid = Math.floor(r.length / 2);
      const i = (y * w + x) * 4;
      dst[i] = r[mid];
      dst[i + 1] = g[mid];
      dst[i + 2] = b[mid];
      dst[i + 3] = a[mid];
    }
  }

  return dst;
}

function gaussianWeight(d: number, sigma: number): number {
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

function bilateralFilter(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number,
  sigmaSpatial: number,
  sigmaRange: number
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const center = getPixel(src, x, y, w);
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      let totalWeight = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const sx = Math.max(0, Math.min(w - 1, x + kx));
          const sy = Math.max(0, Math.min(h - 1, y + ky));
          const p = getPixel(src, sx, sy, w);

          const spatialDist = Math.sqrt(kx * kx + ky * ky);
          const rangeDist = Math.abs(p[0] - center[0]) + Math.abs(p[1] - center[1]) + Math.abs(p[2] - center[2]);

          const weight = gaussianWeight(spatialDist, sigmaSpatial) * gaussianWeight(rangeDist, sigmaRange);

          rSum += p[0] * weight;
          gSum += p[1] * weight;
          bSum += p[2] * weight;
          aSum += p[3] * weight;
          totalWeight += weight;
        }
      }

      const i = (y * w + x) * 4;
      dst[i] = rSum / totalWeight;
      dst[i + 1] = gSum / totalWeight;
      dst[i + 2] = bSum / totalWeight;
      dst[i + 3] = aSum / totalWeight;
    }
  }

  return dst;
}

export function applyDenoise(
  source: HTMLCanvasElement,
  settings: { method: string; strength: number; radius: number }
): HTMLCanvasElement {
  const ctx = source.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  const w = source.width;
  const h = source.height;
  const imageData = ctx.getImageData(0, 0, w, h);

  let result: Uint8ClampedArray;

  if (settings.method === "bilateral") {
    const sigmaSpatial = Math.max(1, settings.radius);
    const sigmaRange = Math.max(10, settings.strength * 15);
    result = bilateralFilter(imageData.data, w, h, Math.min(settings.radius, 10), sigmaSpatial, sigmaRange);
  } else {
    const kernelRadius = Math.min(settings.strength, 10);
    result = medianFilter(imageData.data, w, h, kernelRadius);
  }

  const output = new ImageData(result.slice(), w, h);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const outCtx = canvas.getContext("2d");
  if (!outCtx) throw new Error("Failed to get output canvas context");
  outCtx.putImageData(output, 0, 0);
  return canvas;
}
