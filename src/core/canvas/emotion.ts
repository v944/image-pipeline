const EMOTION_MATRICES: Record<string, number[]> = {
  neutral: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  joy: [1.15, 0.05, -0.05, 0, 15, 0.05, 1.10, 0, 0, 10, -0.10, 0, 0.95, 0, -5, 0, 0, 0, 1, 0],
  sadness: [0.75, 0.15, 0.10, 0, -5, 0.15, 0.75, 0.10, 0, -2, 0.10, 0.15, 0.85, 0, 15, 0, 0, 0, 1, 0],
  calm: [0.90, 0.05, 0.05, 0, 10, 0.05, 0.90, 0.05, 0, 12, 0.05, 0.05, 0.90, 0, 15, 0, 0, 0, 1, 0],
  tension: [1.20, 0, 0, 0, -10, 0, 1.05, 0, 0, -15, 0, 0, 1.10, 0, -10, 0, 0, 0, 1, 0],
};

export function applyEmotionFilter(
  source: HTMLCanvasElement,
  settings: { emotion: string; intensity: number }
): HTMLCanvasElement {
  const emotion = settings.emotion || "neutral";
  const intensity = Math.max(0, Math.min(1, settings.intensity ?? 0.8));

  if (emotion === "neutral" || intensity === 0) {
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
  const matrix = EMOTION_MATRICES[emotion] || EMOTION_MATRICES.neutral;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    const newR = matrix[0] * r + matrix[1] * g + matrix[2] * b + matrix[3] * a + matrix[4];
    const newG = matrix[5] * r + matrix[6] * g + matrix[7] * b + matrix[8] * a + matrix[9];
    const newB = matrix[10] * r + matrix[11] * g + matrix[12] * b + matrix[13] * a + matrix[14];
    const newA = matrix[15] * r + matrix[16] * g + matrix[17] * b + matrix[18] * a + matrix[19];

    data[i] = Math.min(255, Math.max(0, r + (newR - r) * intensity));
    data[i + 1] = Math.min(255, Math.max(0, g + (newG - g) * intensity));
    data[i + 2] = Math.min(255, Math.max(0, b + (newB - b) * intensity));
    data[i + 3] = Math.min(255, Math.max(0, a + (newA - a) * intensity));
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

export function applyEmotionFilterToImageData(
  imageData: ImageData,
  emotion: string,
  intensity: number
): ImageData {
  const data = imageData.data;
  const matrix = EMOTION_MATRICES[emotion] || EMOTION_MATRICES.neutral;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    const newR = matrix[0] * r + matrix[1] * g + matrix[2] * b + matrix[3] * a + matrix[4];
    const newG = matrix[5] * r + matrix[6] * g + matrix[7] * b + matrix[8] * a + matrix[9];
    const newB = matrix[10] * r + matrix[11] * g + matrix[12] * b + matrix[13] * a + matrix[14];
    const newA = matrix[15] * r + matrix[16] * g + matrix[17] * b + matrix[18] * a + matrix[19];

    data[i] = Math.min(255, Math.max(0, r + (newR - r) * intensity));
    data[i + 1] = Math.min(255, Math.max(0, g + (newG - g) * intensity));
    data[i + 2] = Math.min(255, Math.max(0, b + (newB - b) * intensity));
    data[i + 3] = Math.min(255, Math.max(0, a + (newA - a) * intensity));
  }

  return imageData;
}
