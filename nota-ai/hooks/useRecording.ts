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

// expo-audio's RecordingOptions are flat (sampleRate/numberOfChannels/bitRate at the top level)
// plus platform-specific android/ios/web sub-objects.
const RECORDING_OPTIONS: RecordingOptions = {
  extension: '.wav',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 128000,
  isMeteringEnabled: true,
  android: {
    outputFormat: 'default',  // AndroidOutputFormat
    audioEncoder: 'default',  // AndroidAudioEncoder
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
  audioUri: string | null;
  startRecording: (onChunk: (data: ArrayBuffer) => void) => Promise<void>;
  stopRecording: () => Promise<string | null>;
}

export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [metering, setMetering] = useState<number[]>(Array(30).fill(0));
  const [audioUri, setAudioUri] = useState<string | null>(null);

  // useAudioRecorder manages the recorder's lifecycle automatically.
  // It accepts RecordingOptions and an optional status listener.
  const recorder = useAudioRecorder(RECORDING_OPTIONS);

  // useAudioRecorderState polls recorder.getStatus() and returns RecorderState:
  // { canRecord, isRecording, durationMillis, mediaServicesDidReset, metering?, url }
  // Poll at 250ms to match the original chunk interval frequency.
  const recorderState = useAudioRecorderState(recorder, 250);

  const onChunkRef = useRef<((data: ArrayBuffer) => void) | null>(null);
  const lastByteOffsetRef = useRef(0);
  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mirror metering from recorderState into the rolling metering array.
  // recorderState.metering is a dBFS number (typically -160 to 0), same semantics
  // as expo-av's status.metering.
  useEffect(() => {
    if (!isRecording) return;
    const level = recorderState.metering ?? -60;
    const normalized = Math.max(0, Math.min(1, (level + 60) / 60));
    setMetering(prev => [...prev.slice(1), normalized]);
  }, [recorderState.metering, isRecording]);

  const startRecording = useCallback(async (onChunk: (data: ArrayBuffer) => void) => {
    onChunkRef.current = onChunk;
    lastByteOffsetRef.current = 0;

    // expo-audio uses requestRecordingPermissionsAsync (standalone function, not Audio.requestPermissionsAsync)
    await requestRecordingPermissionsAsync();

    // expo-audio's AudioMode has renamed fields:
    //   allowsRecordingIOS → allowsRecording
    //   playsInSilentModeIOS → playsInSilentMode
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    // prepareToRecordAsync must be called before record().
    // Options can be omitted here since we already passed them to useAudioRecorder.
    await recorder.prepareToRecordAsync();

    // recorder.record() is synchronous (no Async suffix). Takes optional RecordingStartOptions.
    recorder.record();
    setIsRecording(true);

    // Poll and stream audio chunks every 250ms — same strategy as before.
    // recorder.uri is the live file URI (available after prepareToRecordAsync).
    chunkIntervalRef.current = setInterval(async () => {
      const uri = recorder.uri;
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
  }, [recorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    setIsRecording(false);
    setMetering(Array(30).fill(0));
    onChunkRef.current = null;

    if (!recorder.isRecording) return null;
    try {
      // recorder.stop() is async (returns Promise<void>).
      // After stop(), recorder.uri holds the final file path.
      await recorder.stop();
      const uri = recorder.uri ?? null;
      setAudioUri(uri);
      lastByteOffsetRef.current = 0;
      return uri;
    } catch {
      return null;
    }
  }, [recorder]);

  return { isRecording, metering, audioUri, startRecording, stopRecording };
}
