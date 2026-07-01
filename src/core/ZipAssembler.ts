import JSZip from "jszip";
import ZipWorker from "./zip-worker?worker";

export interface ZipEntry {
  name: string;
  blob: Blob;
}

export class ZipAssembler {
  async assemble(entries: ZipEntry[]): Promise<Blob> {
    const zip = new JSZip();
    entries.forEach((entry) => {
      zip.file(entry.name, entry.blob);
    });
    return zip.generateAsync({ type: "blob", compression: "STORE" });
  }

  async assembleInWorker(entries: ZipEntry[]): Promise<Blob> {
    if (typeof Worker === "undefined") {
      return this.assemble(entries);
    }
    return new Promise((resolve, reject) => {
      const worker = new ZipWorker();
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };
      worker.onerror = (e) => {
        reject(e);
        worker.terminate();
      };
      worker.postMessage(entries);
    });
  }
}
