import type { TranscriptWord } from '@/types';

export interface DeepgramResult {
  words: TranscriptWord[];
  transcript: string;
  isFinal: boolean;
  speechFinal: boolean;
}

type ResultCallback = (result: DeepgramResult) => void;
type ErrorCallback = (error: Error) => void;

export class DeepgramClient {
  private ws: WebSocket | null = null;
  private onResult: ResultCallback;
  private onError: ErrorCallback;
  private language: string;
  private apiKey: string;

  constructor(apiKey: string, language: string, onResult: ResultCallback, onError: ErrorCallback) {
    this.apiKey = apiKey;
    this.language = language;
    this.onResult = onResult;
    this.onError = onError;
  }

  connect(): void {
    const params = new URLSearchParams({
      encoding: 'linear16',
      sample_rate: '16000',
      channels: '1',
      language: this.language,
      model: 'nova-3',
      smart_format: 'true',
      interim_results: 'true',
      endpointing: '300',
    });

    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

    // React Native WebSocket supports headers as 3rd argument (RN-only extension)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ws = new (WebSocket as any)(url, [], {
      headers: { Authorization: `Token ${this.apiKey}` },
    });

    const ws = this.ws!;
    ws.binaryType = 'arraybuffer';

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type !== 'Results') return;
        const alt = data.channel?.alternatives?.[0];
        if (!alt) return;
        this.onResult({
          words: (alt.words ?? []) as TranscriptWord[],
          transcript: alt.transcript ?? '',
          isFinal: data.is_final === true,
          speechFinal: data.speech_final === true,
        });
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      this.onError(new Error('Deepgram WebSocket error'));
    };
  }

  sendAudio(chunk: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
    }
  }

  disconnect(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
