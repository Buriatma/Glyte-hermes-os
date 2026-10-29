export type ImageToolResult = {
  images: {
    url: string;
    mimeType?: string;
  }[];
  mode?: "create" | "edit" | "composite";
  guide?: string;
  model: string;
};

export const nanoBananaTool = {
  name: "image_tool",
  description: "Generate images with Hermes image capabilities",
  execute: async () => ({ images: [] }),
};

export const openaiImageTool = {
  name: "openai_image_tool",
  description: "Legacy image generator tool",
  execute: async () => ({ images: [] }),
};
