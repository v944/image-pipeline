import { useState, useCallback, useEffect } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useFilesStore } from "../../stores/files.store";
import { usePipelineStore } from "../../stores/pipeline.store";
import { useUIStore } from "../../stores/ui.store";
import { PipelineEngine } from "../../core/PipelineEngine";
import { ZipAssembler } from "../../core/ZipAssembler";
import { cn } from "../../lib";

export function ProcessingModal() {
  const isProcessing = useUIStore((s) => s.isProcessing);
  const setProcessing = useUIStore((s) => s.setProcessing);
  const progress = useUIStore((s) => s.processingProgress);
  const setProgress = useUIStore((s) => s.setProgress);
  const files = useFilesStore((s) => s.files);
  const updateFileStatus = useFilesStore((s) => s.updateFileStatus);
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);

  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  const processImages = useCallback(async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);
    setFileErrors([]);
    setResults([]);
    setShowCompletion(false);

    const all = useFilesStore.getState().files;
    all.forEach((f) => updateFileStatus(f.id, "pending"));
    const processed: { name: string; blob: Blob }[] = [];
    const engine = new PipelineEngine();

    for (let i = 0; i < all.length; i++) {
      const file = all[i];
      updateFileStatus(file.id, "processing");

      try {
        const img = new Image();
        const blob = await fetch(file.blobUrl).then((r) => r.blob());
        const url = URL.createObjectURL(blob);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = url;
        });
        URL.revokeObjectURL(url);

        const srcCanvas = document.createElement("canvas");
        srcCanvas.width = img.width;
        srcCanvas.height = img.height;
        const ctx = srcCanvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const resultBlob = await engine.execute(srcCanvas, nodes, edges);

        processed.push({
          name: `processed-${i + 1}.${(resultBlob.type.split("/")[1] || "png").replace("jpeg", "jpg")}`,
          blob: resultBlob,
        });

        updateFileStatus(file.id, "done");
      } catch (err) {
          const msg = err instanceof Error ? err.message : "Processing failed";
          setFileErrors((prev) => [...prev, `"${file.name}": ${msg}`]);
          updateFileStatus(file.id, "error", msg);
        }

      setProgress(i + 1, all.length);
    }

    setResults(processed);
    setProcessing(false);
    setShowCompletion(true);
  }, [files, nodes, edges, setProcessing, setProgress, updateFileStatus]);

  useEffect(() => {
    const handler = () => processImages();
    window.addEventListener("start-processing", handler);
    return () => window.removeEventListener("start-processing", handler);
  }, [processImages]);

  const downloadAll = useCallback(async () => {
    if (results.length === 0) return;
    const assembler = new ZipAssembler();
    try {
      const zipBlob = await assembler.assemble(results);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "image-pipeline-output.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      if (results.length === 1) {
        const url = URL.createObjectURL(results[0].blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = results[0].name;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  }, [results]);

  if (!isProcessing && !showCompletion) return null;

  const doneFiles = results.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {isProcessing && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-100">Processing images...</h3>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 mb-2">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${files.length > 0 ? (progress / files.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {progress} of {files.length} files
            </p>
          </>
        )}

        {showCompletion && (
          <>
            <div className="text-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-100">Processing Complete</h3>
              <p className="text-sm text-gray-400 mt-1">
                {doneFiles} file{doneFiles !== 1 ? "s" : ""} processed
              </p>
            </div>

            {(error || fileErrors.length > 0) && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                {error && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                )}
                {fileErrors.map((msg, i) => (
                  <p key={i} className="text-xs text-red-300 mt-1">{msg}</p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={downloadAll}
                disabled={results.length === 0}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm",
                  "bg-amber-500 hover:bg-amber-400 text-black transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Download className="w-4 h-4" />
                Download ZIP ({doneFiles} files)
              </button>
              <button
                onClick={() => {
                  setShowCompletion(false);
                  setResults([]);
                }}
                className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
