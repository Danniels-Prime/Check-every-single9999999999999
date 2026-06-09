import { getSettings } from './storage';

export interface DeepgramConfig {
  language: string;
  model?: string;
  diarize?: boolean;
  punctuate?: boolean;
  sampleRate?: number;
}

export interface DeepgramHandlers {
  onTranscript: (text: string, isFinal: boolean, speaker: number, start: number, end: number) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

export class DeepgramClient {
  private ws: WebSocket | null = null;
  private handlers: DeepgramHandlers;

  constructor(handlers: DeepgramHandlers) {
    this.handlers = handlers;
  }

  async connect(config: DeepgramConfig): Promise<void> {
    const { deepgramKey } = await getSettings();
    if (!deepgramKey) throw new Error('Deepgram API key not set. Go to Settings to add your key.');

    const params = new URLSearchParams({
      language: config.language,
      model: config.model ?? 'nova-2',
      diarize: String(config.diarize ?? true),
      punctuate: String(config.punctuate ?? true),
      smart_format: 'true',
      interim_results: 'true',
      encoding: 'linear16',
      sample_rate: String(config.sampleRate ?? 16000),
    });

    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

    // React Native WebSocket supports headers as a 3rd arg (RN extension, not in TS types)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const WS = WebSocket as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.ws = new WS(url, undefined, { headers: { Authorization: `Token ${deepgramKey}` } }) as WebSocket;

    this.ws.onopen = () => {};

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type !== 'Results') return;
        const alt = data.channel?.alternatives?.[0];
        if (!alt?.transcript) return;
        const isFinal: boolean = data.is_final ?? false;
        const speaker: number = alt.words?.[0]?.speaker ?? 0;
        const start: number = data.start ?? 0;
        const end: number = (data.start ?? 0) + (data.duration ?? 0);
        this.handlers.onTranscript(alt.transcript as string, isFinal, speaker, start, end);
      } catch {
        // ignore malformed frames
      }
    };

    this.ws.onerror = () => {
      this.handlers.onError('Deepgram connection error. Check your API key and internet connection.');
    };

    this.ws.onclose = () => {
      this.handlers.onClose();
    };
  }

  sendAudioChunk(data: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  disconnect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'CloseStream' }));
    }
    this.ws?.close();
    this.ws = null;
  }
}
