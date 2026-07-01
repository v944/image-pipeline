import { useRef, useEffect, useMemo } from "react";
import { applyDenoise } from "../../core/canvas/denoise";

const W = 200;
const H = 150;

function generateTestPattern(): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const cx = W / 2;
  const cy = H / 2;
  const r1 = 40;
  const r2 = 25;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r1);
  grad.addColorStop(0, "#eab308");
  grad.addColorStop(0.6, "#f97316");
  grad.addColorStop(1, "#dc2626");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(cx - r2, cy - r2 - 30, r2 * 2, r2 * 2);

  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(cx + 35, cy - 10, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#a78bfa";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("A", cx, cy + 45);

  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 50, cy - 50);
  ctx.lineTo(cx + 50, cy - 70);
  ctx.lineTo(cx - 30, cy - 20);
  ctx.closePath();
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, W, H);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (Math.random() < 0.08) {
      const v = Math.random() < 0.5 ? 0 : 255;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
  }

  return imageData;
}

export function DenoisePreview({
  method,
  strength,
  radius,
}: {
  method: string;
  strength: number;
  radius: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pattern = useMemo(() => generateTestPattern(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const src = document.createElement("canvas");
    src.width = W;
    src.height = H;
    const srcCtx = src.getContext("2d")!;
    srcCtx.putImageData(pattern, 0, 0);

    const result = applyDenoise(src, { method, strength, radius });
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(result, 0, 0);
  }, [pattern, method, strength, radius]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400">Preview</label>
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={W} height={H} className="block w-full" />
      </div>
    </div>
  );
}
