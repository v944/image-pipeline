import { Trash2, CheckCircle2, Loader2, AlertCircle, Lock } from "lucide-react";
import { useFilesStore } from "../../stores/files.store";

export function FileList() {
  const files = useFilesStore((s) => s.files);
  const removeFile = useFilesStore((s) => s.removeFile);
  const clearFiles = useFilesStore((s) => s.clearFiles);

  if (files.length === 0) return null;

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-xs font-medium text-gray-400">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={clearFiles}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className={file.status === "blocked" ? "flex items-center gap-2 px-2 py-1.5 rounded-lg opacity-60" : "flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 group transition-colors"}
          >
            <div className="w-8 h-8 rounded overflow-hidden bg-white/5 flex-shrink-0">
              {file.previewUrl && (
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-300 truncate">{file.name}</div>
              <div className="text-[10px] text-gray-500">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </div>
              {file.status === "blocked" && (
                <div className="text-[10px] text-amber-500 mt-0.5">
                  Upgrade to Pro — up to 500MB
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {file.status === "done" && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              )}
              {file.status === "processing" && (
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              )}
              {file.status === "error" && (
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              )}
              {file.status === "blocked" && (
                <Lock className="w-3 h-3 text-amber-500/60" />
              )}
              <button
                onClick={() => removeFile(file.id)}
                className={file.status === "blocked" ? "transition-opacity p-0.5" : "opacity-0 group-hover:opacity-100 transition-opacity p-0.5"}
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
