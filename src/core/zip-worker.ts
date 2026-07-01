import JSZip from "jszip";

self.onmessage = async (e: MessageEvent) => {
  const entries: { name: string; blob: Blob }[] = e.data;
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.name, entry.blob);
  }
  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  self.postMessage(blob);
};
