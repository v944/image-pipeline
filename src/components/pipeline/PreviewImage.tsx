import { useState, useRef } from "react";

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
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

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
      {showTooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPos.x + 20,
            top: tooltipPos.y - 75,
          }}
        >
          <img
            src={src}
            alt={alt}
            className="border border-white/10 rounded-lg shadow-xl"
            style={{ width: "300px", height: "auto", maxHeight: "200px", objectFit: "contain" }}
          />
        </div>
      )}
    </div>
  );
}
