import { useState, useRef, useCallback, useEffect } from 'react';
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  IOSOutputFormat,
  AudioQuality,
} from 'expo-audio';
import type { RecordingOptions } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

const RECORDING_OPTIONS: RecordingOptions = {
  extension: '.wav',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 128000,
  isMeteringEnabled: true,
  android: {
    outputFormat: 'default',
    audioEncoder: 'default',
  },
  ios: {
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.HIGH,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export interface UseRecordingReturn {
  isRecording: boolean;
  metering: number[];
  startRecording: (onChunk: (data: ArrayBuffer) => void) => Promise<void>;
  stopRecording: () => Promise<void>;
}

export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [metering, setMetering] = useState<number[]>(Array(30).fill(0));

  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 200);

  const onChunkRef = useRef<((data: ArrayBuffer) => void) | null>(null);
  const lastByteOffsetRef = useRef(0);
  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    const level = recorderState.metering ?? -60;
    const normalized = Math.max(0, Math.min(1, (level + 60) / 60));
    setMetering(prev => [...prev.slice(1), normalized]);
  }, [recorderState.metering, isRecording]);

  const startRecording = useCallback(async (onChunk: (data: ArrayBuffer) => void) => {
    onChunkRef.current = onChunk;
    lastByteOffsetRef.current = 0;

    await requestRecordingPermissionsAsync();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);

    chunkIntervalRef.current = setInterval(async () => {
      const uri = recorder.uri;
      if (!uri || !onChunkRef.current) return;
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists || info.isDirectory) return;
        const fileSize = (info as any).size as number;
        if (fileSize <= lastByteOffsetRef.current) return;

        const b64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
          position: lastByteOffsetRef.current,
          length: fileSize - lastByteOffsetRef.current,
        });
        lastByteOffsetRef.current = fileSize;

        const binary = atob(b64);
        const buffer = new ArrayBuffer(binary.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
        onChunkRef.current(buffer);
      } catch { /* ignore chunk read errors */ }
    }, 250);
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    setIsRecording(false);
    setMetering(Array(30).fill(0));
    onChunkRef.current = null;

    if (!recorder.isRecording) return;
    try {
      await recorder.stop();
    } catch { /* ignore */ }
    lastByteOffsetRef.current = 0;
  }, [recorder]);

  return { isRecording, metering, startRecording, stopRecording };
}
