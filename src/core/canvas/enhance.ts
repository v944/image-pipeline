export function lanczosKernel(x: number, lobes: number): number {
  if (x === 0) return 1;
  if (x >= lobes) return 0;
  const px = Math.PI * x;
  return (Math.sin(px) / px) * (Math.sin(px / lobes) / (px / lobes));
}

export function applyLanczos(
  source: HTMLCanvasElement,
  dstW: number,
  dstH: number,
  lobes = 3
): HTMLCanvasElement {
  const srcCtx = source.getContext("2d");
  if (!srcCtx) throw new Error("Failed to get source context");

  const srcW = source.width;
  const srcH = source.height;
  const srcData = srcCtx.getImageData(0, 0, srcW, srcH);
  const src = srcData.data;

  const dstCanvas = document.createElement("canvas");
  dstCanvas.width = dstW;
  dstCanvas.height = dstH;
  const dstCtx = dstCanvas.getContext("2d");
  if (!dstCtx) throw new Error("Failed to get destination context");

  const dstData = dstCtx.createImageData(dstW, dstH);
  const dst = dstData.data;

  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    const centerY = y * yRatio;
    const yFloor = Math.floor(centerY);
    const yStart = Math.max(0, yFloor - lobes + 1);
    const yEnd = Math.min(srcH, yFloor + lobes);

    for (let x = 0; x < dstW; x++) {
      const centerX = x * xRatio;
      const xFloor = Math.floor(centerX);
      const xStart = Math.max(0, xFloor - lobes + 1);
      const xEnd = Math.min(srcW, xFloor + lobes);

      let r = 0, g = 0, b = 0, aSum = 0;
      let totalWeight = 0;

      for (let sy = yStart; sy < yEnd; sy++) {
        const dy = Math.abs(sy - centerY + 0.5);
        const wy = lanczosKernel(dy, lobes);

        for (let sx = xStart; sx < xEnd; sx++) {
          const dx = Math.abs(sx - centerX + 0.5);
          const weight = wy * lanczosKernel(dx, lobes);

          const idx = (sy * srcW + sx) * 4;
          r += src[idx] * weight;
          g += src[idx + 1] * weight;
          b += src[idx + 2] * weight;
          aSum += src[idx + 3] * weight;
          totalWeight += weight;
        }
      }

      if (totalWeight > 0) {
        const dstIdx = (y * dstW + x) * 4;
        const inv = 1 / totalWeight;
        dst[dstIdx] = r * inv;
        dst[dstIdx + 1] = g * inv;
        dst[dstIdx + 2] = b * inv;
        dst[dstIdx + 3] = aSum * inv;
      }
    }
  }

  dstCtx.putImageData(dstData, 0, 0);
  return dstCanvas;
}
