export function sanitizeFilename(name: string): string {
  return name
    .replace(/\0/g, "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\.\./g, "")
    .trim();
}

export function sanitizeWatermarkText(text: string): string {
  return text.replace(/<[^>]*>/g, "").slice(0, 200);
}

export function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (["__proto__", "constructor", "prototype"].includes(key)) continue;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = sanitizeData(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
