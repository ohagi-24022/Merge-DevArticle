/**
 * Image generation is not enabled by default.
 * Wire an OpenAI / Stability / Replicate client here if needed.
 */
export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  _options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  throw new Error(
    "generateImage is not configured. Implement in server/_core/imageGeneration.ts.",
  );
}
