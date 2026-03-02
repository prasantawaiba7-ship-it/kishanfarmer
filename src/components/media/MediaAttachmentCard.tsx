// MediaAttachmentCard: renders audio/video player card for chat messages
import { useState, useRef } from 'react';
import { Play, Pause, Volume2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaAttachmentCardProps {
  type: 'audio' | 'video';
  fileUrl: string;
  durationSeconds?: number | null;
  senderLabel?: string;
}

export function MediaAttachmentCard({ type, fileUrl, durationSeconds, senderLabel }: MediaAttachmentCardProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (playing) {
      mediaRef.current.pause();
      setPlaying(false);
    } else {
      mediaRef.current.play();
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) setCurrentTime(mediaRef.current.currentTime);
  };

  const handleEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
  };

  if (type === 'video') {
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-border/40 bg-muted/20 max-w-[280px]">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/40">
          <Video className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">
            भिडियो {durationSeconds ? `• ${formatTime(durationSeconds)}` : ''}
          </span>
        </div>
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={fileUrl}
          controls
          className="w-full max-h-48"
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      </div>
    );
  }

  // Audio card
  return (
    <div className="mt-2 flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-muted/20 min-w-[180px] max-w-[260px]">
      <audio
        ref={mediaRef as React.RefObject<HTMLAudioElement>}
        src={fileUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={togglePlay}>
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            भ्वाइस नोट
          </span>
        </div>
        <span className="text-xs font-mono text-foreground">
          {formatTime(currentTime)} {durationSeconds ? `/ ${formatTime(durationSeconds)}` : ''}
        </span>
      </div>
    </div>
  );
}
