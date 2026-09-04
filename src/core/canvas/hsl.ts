import { rgbToHsl, hslToRgb } from "./color";

export interface HslSettings {
  hue?: number;
  saturation?: number;
  lightness?: number;
}

export function applyHsl(
  source: HTMLCanvasElement,
  settings: HslSettings
): HTMLCanvasElement {
  const hue = Math.max(-180, Math.min(180, settings.hue ?? 0));
  const saturation = Math.max(-100, Math.min(100, settings.saturation ?? 0));
  const lightness = Math.max(-100, Math.min(100, settings.lightness ?? 0));

  if (hue === 0 && saturation === 0 && lightness === 0) {
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

  const hueShift = hue / 360;
  const satValue = saturation / 100;
  const lgtShift = lightness / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const [hueIn, satIn, lgtIn] = rgbToHsl(r, g, b);

    let newHue = hueIn;
    if (hue !== 0) {
      let shifted = hueIn + hueShift;
      shifted = ((shifted % 1) + 1) % 1;
      newHue = shifted;
    }

    let newSat = satIn;
    if (satValue !== 0) {
      newSat = satValue > 0
        ? satIn + (1 - satIn) * satValue
        : satIn * (1 + satValue);
      newSat = Math.max(0, Math.min(1, newSat));
    }

    let newLgt = lgtIn;
    if (lgtShift !== 0) {
      newLgt = lgtShift > 0 ? (lgtIn + (1 - lgtIn) * lgtShift) : (lgtIn * (1 + lgtShift));
      newLgt = Math.max(0, Math.min(1, newLgt));
    }

    const [nr, ng, nb] = hslToRgb(newHue, newSat, newLgt);
    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
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
