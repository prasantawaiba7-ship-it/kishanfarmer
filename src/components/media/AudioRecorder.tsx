// AudioRecorder: handles microphone permission, recording, preview, returns blob + duration
import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioRecorderProps {
  maxDuration?: number; // seconds, default 60
  onRecorded: (blob: Blob, durationSeconds: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function AudioRecorder({ maxDuration = 60, onRecorded, onCancel, disabled }: AudioRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'recorded' | 'playing'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
  }, [audioUrl]);

  useEffect(() => () => cleanup(), [cleanup]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const b = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (b.size > 5 * 1024 * 1024) {
          setState('idle');
          return;
        }
        setBlob(b);
        const url = URL.createObjectURL(b);
        setAudioUrl(url);
        setState('recorded');
      };
      mediaRecorderRef.current = mr;
      mr.start(250);
      startTimeRef.current = Date.now();
      setElapsed(0);
      setState('recording');
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(secs);
        if (secs >= maxDuration) {
          mr.stop();
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 250);
    } catch {
      // permission denied or not supported
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const playPreview = () => {
    if (!audioUrl) return;
    const a = new Audio(audioUrl);
    audioRef.current = a;
    a.onended = () => setState('recorded');
    a.play();
    setState('playing');
  };

  const pausePreview = () => {
    audioRef.current?.pause();
    setState('recorded');
  };

  const reRecord = () => {
    cleanup();
    setBlob(null);
    setAudioUrl(null);
    setElapsed(0);
    setState('idle');
  };

  const confirm = () => {
    if (blob) onRecorded(blob, elapsed);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl border border-border/60 bg-muted/30">
      {state === 'idle' && (
        <Button variant="outline" size="sm" onClick={startRecording} disabled={disabled} className="gap-1.5">
          <Mic className="w-4 h-4 text-red-500" />
          रेकर्ड गर्नुहोस्
        </Button>
      )}

      {state === 'recording' && (
        <>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono text-foreground">{formatTime(elapsed)} / {formatTime(maxDuration)}</span>
          </div>
          <Button variant="destructive" size="icon" className="w-8 h-8" onClick={stopRecording}>
            <Square className="w-3.5 h-3.5" />
          </Button>
        </>
      )}

      {(state === 'recorded' || state === 'playing') && (
        <>
          <span className="text-xs text-muted-foreground font-mono">{formatTime(elapsed)}</span>
          {state === 'recorded' ? (
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={playPreview}>
              <Play className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={pausePreview}>
              <Pause className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={reRecord}>
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="default" size="sm" onClick={confirm} disabled={disabled} className="gap-1">
            <Check className="w-3.5 h-3.5" /> पठाउनुहोस्
          </Button>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>रद्द</Button>
          )}
        </>
      )}
    </div>
  );
}
