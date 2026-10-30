import { describe, it, expect, beforeAll } from "vitest";
import { createCanvas, ImageData as NCImageData } from "canvas";
import {
  applyBlur,
  applySharpen,
  applyRotate,
  applyGrayscale,
  applyTemperature,
  applyHsl,
  applyBrightness,
} from "../core/canvas";

// happy-dom has no real 2D canvas context — back canvas creation with node-canvas,
// and use node-canvas ImageData so putImageData accepts it
beforeAll(() => {
  (globalThis as Record<string, unknown>).ImageData = NCImageData;
  const original = document.createElement.bind(document);
  document.createElement = ((tagName: string, options?: ElementCreationOptions) => {
    if (String(tagName).toLowerCase() === "canvas") {
      return createCanvas(1, 1) as unknown as HTMLElement;
    }
    return original(tagName, options);
  }) as typeof document.createElement;
});

function makeCanvas(width: number, height: number, fill: string): HTMLCanvasElement {
  const canvas = createCanvas(width, height) as unknown as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

function pixel(canvas: HTMLCanvasElement, x: number, y: number): number[] {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  return Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3));
}

function solidCanvas(width: number, height: number, bg: string, px: number, py: number, color: string): HTMLCanvasElement {
  const canvas = createCanvas(width, height) as unknown as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(px, py, 1, 1);
  return canvas;
}

describe("canvas operations", () => {
  it("grayscale makes channels equal at full strength", () => {
    const out = applyGrayscale(makeCanvas(2, 2, "#ff0000"), { value: 100 });
    const [r, g, b] = pixel(out, 0, 0);
    expect(Math.abs(r - g)).toBeLessThanOrEqual(2);
    expect(Math.abs(g - b)).toBeLessThanOrEqual(2);
  });

  it("grayscale with zero value is an identity", () => {
    const src = makeCanvas(2, 2, "#336699");
    const out = applyGrayscale(src, { value: 0 });
    expect(pixel(out, 0, 0)).toEqual(pixel(src, 0, 0));
  });

  it("temperature shifts warm/cool channels", () => {
    const base = makeCanvas(2, 2, "#808080");
    const warm = pixel(applyTemperature(base, { value: 100 }), 0, 0);
    expect(warm[0]).toBeGreaterThan(warm[2]);
    const cool = pixel(applyTemperature(base, { value: -100 }), 0, 0);
    expect(cool[2]).toBeGreaterThan(cool[0]);
  });

  it("brightness raises and lowers values", () => {
    const base = makeCanvas(2, 2, "#646464");
    const up = pixel(applyBrightness(base, { value: 50 }), 0, 0);
    const down = pixel(applyBrightness(base, { value: -50 }), 0, 0);
    expect(up[0]).toBeGreaterThan(100);
    expect(down[0]).toBeLessThan(100);
  });

  it("blur spreads a bright pixel to neighbours", () => {
    const src = solidCanvas(5, 5, "#000000", 2, 2, "#ffffff");
    const out = applyBlur(src, { value: 50 });
    expect(pixel(out, 0, 2)[0]).toBeGreaterThan(0);
  });

  it("blur with zero value is an identity", () => {
    const src = makeCanvas(3, 3, "#225588");
    const out = applyBlur(src, { value: 0 });
    expect(pixel(out, 1, 1)).toEqual(pixel(src, 1, 1));
  });

  it("sharpen increases local contrast", () => {
    const src = solidCanvas(5, 5, "#808080", 2, 2, "#ffffff");
    const before = Math.abs(pixel(src, 2, 2)[0] - pixel(src, 1, 2)[0]);
    const out = applySharpen(src, { value: 100 });
    const after = Math.abs(pixel(out, 2, 2)[0] - pixel(out, 1, 2)[0]);
    expect(after).toBeGreaterThan(before);
  });

  it("rotate 90 degrees swaps dimensions", () => {
    const src = makeCanvas(4, 2, "#123456");
    const out = applyRotate(src, { rotation: "90", flip: "none" });
    expect(out.width).toBe(2);
    expect(out.height).toBe(4);
    expect(pixel(out, 0, 0)).toEqual(pixel(src, 0, 0));
  });

  it("rotate horizontal flip mirrors pixels", () => {
    const src = createCanvas(2, 1) as unknown as HTMLCanvasElement;
    const ctx = src.getContext("2d") as CanvasRenderingContext2D;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = "#000000";
    ctx.fillRect(1, 0, 1, 1);
    const out = applyRotate(src, { rotation: "none", flip: "horizontal" });
    expect(pixel(out, 0, 0)[0]).toBe(0);
    expect(pixel(out, 1, 0)[0]).toBe(255);
  });

  it("hsl with zero settings is an identity", () => {
    const src = makeCanvas(2, 2, "#7a3cb0");
    const out = applyHsl(src, { hue: 0, saturation: 0, lightness: 0 });
    const a = pixel(out, 0, 0);
    const b = pixel(src, 0, 0);
    expect(Math.abs(a[0] - b[0])).toBeLessThanOrEqual(2);
    expect(Math.abs(a[1] - b[1])).toBeLessThanOrEqual(2);
    expect(Math.abs(a[2] - b[2])).toBeLessThanOrEqual(2);
  });

  it("hsl full desaturation removes colour", () => {
    const out = applyHsl(makeCanvas(2, 2, "#ff8800"), { saturation: -100 });
    const [r, g, b] = pixel(out, 0, 0);
    expect(Math.abs(r - g)).toBeLessThanOrEqual(3);
    expect(Math.abs(g - b)).toBeLessThanOrEqual(3);
  });
});
