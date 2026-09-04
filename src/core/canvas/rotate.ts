export function applyRotate(
  source: HTMLCanvasElement,
  settings: { rotation: string; flip: string }
): HTMLCanvasElement {
  const rotation = settings.rotation || "none";
  const flip = settings.flip || "none";

  let sw = source.width;
  let sh = source.height;

  const rotate90 = rotation === "90" || rotation === "270";
  if (rotate90) {
    sw = source.height;
    sh = source.width;
  }

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.translate(sw / 2, sh / 2);

  if (flip === "horizontal") ctx.scale(-1, 1);
  if (flip === "vertical") ctx.scale(1, -1);

  const radians = (({ none: 0, "90": 90, "180": 180, "270": 270 } as Record<string, number>)[rotation] || 0) * (Math.PI / 180);
  ctx.rotate(radians);

  ctx.drawImage(source, -source.width / 2, -source.height / 2);

  return canvas;
}
