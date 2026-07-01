import { BaseNode } from "./BaseNode";

export const nodeTypes = {
  load: BaseNode,
  resize: BaseNode,
  crop: BaseNode,
  compress: BaseNode,
  format: BaseNode,
  watermark: BaseNode,
  denoise: BaseNode,
  rename: BaseNode,
  export: BaseNode,
};
