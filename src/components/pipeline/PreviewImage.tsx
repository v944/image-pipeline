import { useState, useRef, useEffect, useCallback } from "react";

const ZOOM = 200;

export function PreviewImage({
  src,
  alt,
  label,
  className = "",
}: {
  src: string;
  alt: string;
  label?: string;
  className?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hasImage, setHasImage] = useState(false);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const naturalRef = useRef({ w: 0, h: 0 });
  const srcRef = useRef(src);
  srcRef.current = src;
  naturalRef.current = natural;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setHasImage(true);
    };
    img.src = src;
  }, [src]);

  const drawPixelZoom = useCallback(
    (canvas: HTMLCanvasElement, sx: number, sy: number) => {
      const { w, h } = naturalRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          Math.max(0, Math.floor(sx)),
          Math.max(0, Math.floor(sy)),
          Math.min(ZOOM, w - sx - ZOOM > 0 ? ZOOM : w - sx),
          Math.min(ZOOM, h - sy - ZOOM > 0 ? ZOOM : h - sy),
          0,
          0,
          ZOOM,
          ZOOM
        );
      };
      img.src = srcRef.current;
    },
    []
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = imgRef.current;
    if (!el || !hasImage) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cw = rect.width;
    const ch = rect.height;
    const iw = natural.w;
    const ih = natural.h;
    if (cw === 0 || ch === 0) return;

    const scale = Math.min(cw / iw, ch / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;
    const offsetX = (cw - drawW) / 2;
    const offsetY = (ch - drawH) / 2;

    const imgX = (mx - offsetX) / scale;
    const imgY = (my - offsetY) / scale;

    setTooltipPos({ x: mx, y: my });

    const canvas = canvasRef.current;
    if (canvas) {
      drawPixelZoom(canvas, imgX, imgY);
    }
  };

  const tooltipStyle: React.CSSProperties = {
    left: tooltipPos.x + 16,
    top: tooltipPos.y - ZOOM / 2,
  };

  const tooltipOffset = (() => {
    const el = imgRef.current;
    if (!el) return { left: tooltipStyle.left, top: tooltipStyle.top };
    let left = tooltipPos.x + 16;
    let top = tooltipPos.y - ZOOM / 2;
    if (left + ZOOM + 8 > window.innerWidth) left = tooltipPos.x - ZOOM - 16;
    if (top < 8) top = 8;
    if (top + ZOOM + 8 > window.innerHeight) top = window.innerHeight - ZOOM - 8;
    return { left, top };
  })();

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onMouseMove={handleMouseMove}
    >
      <img src={src} alt={alt} className="w-full h-full object-contain" />
      {label && (
        <span className="absolute bottom-1 left-1 text-[10px] text-gray-500 bg-black/60 px-1 rounded">
          {label}
        </span>
      )}
      {showTooltip && hasImage && (
        <>
          <div
            className="fixed z-50 pointer-events-none border border-white/15 rounded-lg shadow-2xl bg-black/70 p-1"
            style={{ left: tooltipOffset.left, top: tooltipOffset.top }}
          >
            <canvas
              ref={canvasRef}
              width={ZOOM}
              height={ZOOM}
              className="rounded"
              style={{ width: ZOOM, height: ZOOM, display: "block" }}
            />
            <span className="absolute bottom-2 right-2 text-[10px] text-gray-400 bg-black/60 px-1 rounded">
              100%
            </span>
          </div>
        </>
      )}
    </div>
  );
}
