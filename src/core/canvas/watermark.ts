import { sanitizeWatermarkText } from "../../lib/sanitize";

interface WatermarkSettings {
  text: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  fontSize: number;
  opacity: number;
  color?: string;
}

export function applyWatermark(
  source: HTMLCanvasElement,
  settings: WatermarkSettings
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(source, 0, 0);

  const text = sanitizeWatermarkText(settings.text);
  const padding = 20;
  ctx.globalAlpha = settings.opacity;
  ctx.fillStyle = settings.color || "#FFFFFF";
  ctx.font = `${settings.fontSize}px sans-serif`;

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = settings.fontSize;

  let x: number;
  let y: number;

  switch (settings.position) {
    case "top-left":
      x = padding;
      y = padding + textHeight;
      break;
    case "top-right":
      x = canvas.width - textWidth - padding;
      y = padding + textHeight;
      break;
    case "bottom-left":
      x = padding;
      y = canvas.height - padding;
      break;
    case "bottom-right":
      x = canvas.width - textWidth - padding;
      y = canvas.height - padding;
      break;
    case "center":
      x = (canvas.width - textWidth) / 2;
      y = (canvas.height + textHeight) / 2;
      break;
    default:
      x = padding;
      y = canvas.height - padding;
  }

  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
  return canvas;
}
