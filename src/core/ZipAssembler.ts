import JSZip from "jszip";

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
      const worker = new Worker(
        URL.createObjectURL(
          new Blob(
            [
              `
              importScripts("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
              self.onmessage = async function(e) {
                const zip = new JSZip();
                for (const entry of e.data) {
                  zip.file(entry.name, entry.blob);
                }
                const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
                self.postMessage(blob);
              };
            `,
            ],
            { type: "application/javascript" }
          )
        )
      );
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
