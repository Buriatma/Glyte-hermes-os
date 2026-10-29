"use server";

export async function generateImageWithNanoBanana(options: {
  prompt: string;
}): Promise<{ base64: string; mimeType: string }> {
  return {
    base64: "",
    mimeType: "image/png",
  };
}

export async function generateImage(options: {
  prompt: string;
}): Promise<{ base64: string; mimeType: string }> {
  return {
    base64: "",
    mimeType: "image/png",
  };
}
