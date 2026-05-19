/**
 * Voice transcription is not enabled by default.
 * Implement with OpenAI Whisper or another provider when needed.
 */
export type TranscribeAudioInput = {
  audioUrl: string;
  language?: string;
};

export type TranscribeAudioResult = {
  text: string;
};

export async function transcribeAudio(
  _input: TranscribeAudioInput
): Promise<TranscribeAudioResult> {
  throw new Error(
    "transcribeAudio is not configured. Implement in server/_core/voiceTranscription.ts.",
  );
}
