import { useEffect, useRef, useState, useCallback } from "react";

export function CompareModal({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
  onClose,
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  onClose: () => void;
}) {
  const [split, setSplit] = useState(50);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative max-w-[95vw] max-h-[90vh] bg-[#0D0D14] rounded-xl border border-white/10 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-gray-400 hover:text-white hover:bg-black/70 transition-colors text-lg"
        >
          ×
        </button>
        <div className="relative" style={{ aspectRatio: "16/9", maxWidth: "900px", width: "80vw" }}>
          <img
            src={beforeUrl}
            alt="Before"
            className="absolute inset-0 w-full h-full object-contain"
          />
          <img
            src={afterUrl}
            alt="After"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
            className="absolute bottom-4 left-4 right-4 z-10 w-auto accent-amber-500"
          />
        </div>
        <div className="flex justify-between px-4 py-2 text-xs text-gray-400">
          <span>{beforeLabel || "Original"}</span>
          <span>{afterLabel || "Adjusted"}</span>
        </div>
      </div>
    </div>
  );
}
