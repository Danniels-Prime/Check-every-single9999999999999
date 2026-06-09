const DEEPGRAM_API_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY ?? '';

export type DeepgramConfig = {
  language: string;
  model: 'nova-2' | 'nova-2-meeting' | 'nova-2-conversationalai';
  diarize: boolean;
  punctuate: boolean;
  smart_format: boolean;
  interim_results: boolean;
};

export class DeepgramClient {
  private ws: WebSocket | null = null;
  private onSegment: (segment: Partial<import('../types').Segment>) => void;
  private onError: (err: string) => void;

  constructor(
    onSegment: (seg: Partial<import('../types').Segment>) => void,
    onError: (err: string) => void
  ) {
    this.onSegment = onSegment;
    this.onError = onError;
  }

  connect(config: DeepgramConfig) {
    const params = new URLSearchParams({
      language: config.language,
      model: config.model,
      diarize: String(config.diarize),
      punctuate: String(config.punctuate),
      smart_format: String(config.smart_format),
      interim_results: String(config.interim_results),
      encoding: 'linear16',
      sample_rate: '16000',
    });

    this.ws = new WebSocket(
      `wss://api.deepgram.com/v1/listen?${params}`,
      ['token', DEEPGRAM_API_KEY]
    );

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const alt = data.channel?.alternatives?.[0];
      if (!alt?.transcript) return;

      this.onSegment({
        text: alt.transcript,
        is_final: data.is_final,
        confidence: alt.confidence,
        start_ms: Math.round((data.start || 0) * 1000),
        end_ms: Math.round(((data.start || 0) + (data.duration || 0)) * 1000),
        speaker: data.channel?.alternatives?.[0]?.words?.[0]?.speaker
          ? `Speaker ${data.channel.alternatives[0].words[0].speaker + 1}`
          : undefined,
      });
    };

    this.ws.onerror = () => this.onError('Deepgram connection failed');
  }

  send(audioChunk: ArrayBuffer) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(audioChunk);
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
