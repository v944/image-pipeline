import { useCallback, useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { useFilesStore } from "../../stores/files.store";
import { useUserStore } from "../../stores/user.store";
import { cn } from "../../lib";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/tiff",
];

const FREE_LIMIT = 10 * 1024 * 1024;
const PRO_LIMIT = 500 * 1024 * 1024;

export function FileUploader() {
  const addFiles = useFilesStore((s) => s.addFiles);
  const fileCount = useFilesStore((s) => s.files.length);
  const plan = useUserStore((s) => s.plan);
  const maxFileSize = plan === "free" ? FREE_LIMIT : PRO_LIMIT;
  const limitLabel = plan === "free" ? "10MB" : "500MB";
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const valid: File[] = [];
      const errors: string[] = [];
      const files = Array.from(fileList);

      for (const file of files) {
        if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|avif|gif|bmp|tiff)$/i)) {
          errors.push(`${file.name}: unsupported format`);
          continue;
        }
        if (file.size > maxFileSize) {
          errors.push(`${file.name}: exceeds ${limitLabel} limit`);
          continue;
        }
        valid.push(file);
      }

      if (valid.length > 0) addFiles(valid);
      if (errors.length > 0) {
        console.warn("File upload errors:", errors);
      }
    },
    [addFiles, maxFileSize, limitLabel]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  return (
    <div className="p-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
          isDragOver
            ? "border-amber-400 bg-amber-400/5"
            : "border-white/10 hover:border-white/20 bg-white/[0.02]"
        )}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
        <p className="text-sm text-gray-400">
          Drop images here or click to browse
        </p>
        <p className="text-xs text-gray-600 mt-1">
          JPG, PNG, WebP, AVIF, GIF — up to {limitLabel} each
        </p>
        {fileCount > 0 && (
          <p className="text-xs text-amber-400 mt-2">{fileCount} files loaded</p>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
