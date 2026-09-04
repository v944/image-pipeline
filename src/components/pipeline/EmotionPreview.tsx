import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePipelineStore } from "../../stores/pipeline.store";
import { useFilesStore } from "../../stores/files.store";
import { applyEmotionFilter } from "../../core/canvas/emotion";
import { processUpstreamChain } from "./preview-utils";
import { PreviewImage } from "./PreviewImage";

function generateThumbnail(source: HTMLImageElement, maxSide = 1200): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const scale = maxSide / Math.max(source.naturalWidth, source.naturalHeight);
  canvas.width = Math.round(source.naturalWidth * scale);
  canvas.height = Math.round(source.naturalHeight * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function EmotionPreview({
  nodeId,
  emotion,
  intensity,
  preview,
}: {
  nodeId: string;
  emotion: string;
  intensity: number;
  preview: boolean;
}) {
  const { t } = useTranslation();
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const files = useFilesStore((s) => s.files);

  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasInput, setHasInput] = useState(false);
  const mountedRef = useRef(true);
  const prevKeyRef = useRef("");

  const fileId = (() => {
    const incoming = edges.filter((e) => e.target === nodeId);
    for (const edge of incoming) {
      const src = nodes.find((n) => n.id === edge.source);
      if (src?.type === "load") return src.data?.fileId as string | undefined;
    }
    return undefined;
  })();

  const matchedFile = fileId ? files.find((f) => f.id === fileId) : null;
  const file = matchedFile || files[0] || null;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!preview || !file?.blobUrl) {
      setHasInput(!!file?.blobUrl);
      setAfterUrl(null);
      prevKeyRef.current = "";
      return;
    }

    setHasInput(true);

    const key = `${file.blobUrl}_${emotion}_${intensity}_${nodeId}`;
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    setLoading(true);

    const img = new Image();
    img.onload = async () => {
      if (!mountedRef.current) return;

      const thumb = generateThumbnail(img, 1200);

      let upstreamCanvas: HTMLCanvasElement;
      try {
        upstreamCanvas = await processUpstreamChain(thumb, nodes, edges, nodeId);
      } catch {
        upstreamCanvas = thumb;
      }

      if (!mountedRef.current) return;

      try {
        const filtered = await applyEmotionFilter(upstreamCanvas, { emotion, intensity: intensity / 100 });
        if (!mountedRef.current) return;
        const afterDataUrl = filtered.toDataURL("image/jpeg", 0.9);
        if (!mountedRef.current) return;
        setAfterUrl(afterDataUrl);
      } catch {
        if (mountedRef.current) setAfterUrl(null);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    img.onerror = () => {
      if (mountedRef.current) setLoading(false);
    };
    img.src = file.blobUrl;
  }, [file?.blobUrl, emotion, intensity, preview, nodeId, nodes, edges]);

  if (!preview) {
    return (
      <div className="text-xs text-gray-500 text-center py-3 border border-dashed border-white/10 rounded-lg">
        {t("settings.emotion.previewDisabled")}
      </div>
    );
  }

  if (!hasInput) {
    return (
      <div className="text-xs text-gray-500 text-center py-3 border border-dashed border-white/10 rounded-lg min-h-[120px] flex items-center justify-center">
        {t("settings.emotion.previewNoInput")}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 border border-dashed border-white/10 rounded-lg min-h-[120px]">
        <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400">{t("settings.emotion.previewLabel")}</label>
      <div className="border border-white/10 rounded-lg overflow-hidden bg-black/30">
        {afterUrl ? (
          <PreviewImage src={afterUrl} alt="Adjusted" label={t("settings.emotion.after")} className="w-full" />
        ) : (
          <div className="text-xs text-gray-500 text-center py-6">{t("common.error")}</div>
        )}
      </div>
    </div>
  );
}
