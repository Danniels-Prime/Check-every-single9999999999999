import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
};

export interface UseRecordingReturn {
  isRecording: boolean;
  metering: number[];
  audioUri: string | null;
  startRecording: (onChunk: (data: ArrayBuffer) => void) => Promise<void>;
  stopRecording: () => Promise<string | null>;
}

export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [metering, setMetering] = useState<number[]>(Array(30).fill(0));
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const onChunkRef = useRef<((data: ArrayBuffer) => void) | null>(null);
  const lastByteOffsetRef = useRef(0);
  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async (onChunk: (data: ArrayBuffer) => void) => {
    onChunkRef.current = onChunk;
    lastByteOffsetRef.current = 0;

    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      ...RECORDING_OPTIONS,
      isMeteringEnabled: true,
    });

    recording.setOnRecordingStatusUpdate((status) => {
      if (!status.isRecording) return;
      const level = status.metering ?? -60;
      const normalized = Math.max(0, Math.min(1, (level + 60) / 60));
      setMetering(prev => [...prev.slice(1), normalized]);
    });

    await recording.startAsync();
    recordingRef.current = recording;
    setIsRecording(true);

    // Poll and stream audio chunks every 250ms
    chunkIntervalRef.current = setInterval(async () => {
      const uri = recording.getURI();
      if (!uri || !onChunkRef.current) return;
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists || info.isDirectory) return;
        const fileSize = info.size;
        if (fileSize <= lastByteOffsetRef.current) return;

        const b64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
          position: lastByteOffsetRef.current,
          length: fileSize - lastByteOffsetRef.current,
        });
        lastByteOffsetRef.current = fileSize;

        // Decode base64 → ArrayBuffer
        const binary = atob(b64);
        const buffer = new ArrayBuffer(binary.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; i++) {
          view[i] = binary.charCodeAt(i);
        }
        onChunkRef.current(buffer);
      } catch { /* ignore chunk read errors */ }
    }, 250);
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    setIsRecording(false);
    setMetering(Array(30).fill(0));
    onChunkRef.current = null;

    if (!recordingRef.current) return null;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI() ?? null;
      setAudioUri(uri);
      recordingRef.current = null;
      lastByteOffsetRef.current = 0;
      return uri;
    } catch {
      recordingRef.current = null;
      return null;
    }
  }, []);

  return { isRecording, metering, audioUri, startRecording, stopRecording };
}
