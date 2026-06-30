import { create } from "zustand";

export interface ImageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  blobUrl: string;
  status: "pending" | "processing" | "done" | "error" | "blocked";
  error?: string;
  blockReason?: string;
  previewUrl?: string;
  width?: number;
  height?: number;
}

interface FilesState {
  files: ImageFile[];
  addFiles: (files: File[], status?: "pending" | "blocked", blockReason?: string) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  updateFileStatus: (id: string, status: ImageFile["status"], error?: string) => void;
}

let fileIdCounter = 0;
function generateFileId(): string {
  fileIdCounter++;
  return `file-${fileIdCounter}-${Date.now().toString(36)}`;
}

export const useFilesStore = create<FilesState>()((set, get) => ({
  files: [],

  addFiles: (newFiles, status = "pending", blockReason) => {
    const existing = get().files;
    const toAdd: ImageFile[] = newFiles.map((file) => {
      const id = generateFileId();
      const blobUrl = URL.createObjectURL(file);
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        blobUrl,
        status,
        blockReason: status === "blocked" ? blockReason ?? "file_size" : undefined,
        previewUrl: blobUrl,
      };
    });
    set({ files: [...existing, ...toAdd] });
  },

  removeFile: (id) => {
    const file = get().files.find((f) => f.id === id);
    if (file) {
      URL.revokeObjectURL(file.blobUrl);
      if (file.previewUrl && file.previewUrl !== file.blobUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    }
    set((s) => ({ files: s.files.filter((f) => f.id !== id) }));
  },

  clearFiles: () => {
    get().files.forEach((f) => {
      URL.revokeObjectURL(f.blobUrl);
      if (f.previewUrl && f.previewUrl !== f.blobUrl) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });
    set({ files: [] });
  },

  updateFileStatus: (id, status, error) => {
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id ? { ...f, status, error } : f
      ),
    }));
  },
}));
