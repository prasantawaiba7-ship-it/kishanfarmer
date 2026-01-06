import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Loader2, Volume2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';

interface VoiceChatButtonProps {
  onMessage?: (message: { role: 'user' | 'assistant'; content: string }) => void;
}

export function VoiceChatButton({ onMessage }: VoiceChatButtonProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [showPanel, setShowPanel] = useState(false);

  const {
    status,
    isSpeaking,
    transcript,
    connect,
    disconnect,
    isConnected
  } = useRealtimeVoice({
    language,
    onMessage: (msg) => {
      onMessage?.(msg);
    },
    onError: (error) => {
      toast({
        title: language === 'ne' ? 'त्रुटि' : 'Error',
        description: error,
        variant: 'destructive'
      });
    },
    onStatusChange: (newStatus) => {
      if (newStatus === 'connected') {
        toast({
          title: language === 'ne' ? 'जोडियो!' : 'Connected!',
          description: language === 'ne' ? 'अब बोल्न सक्नुहुन्छ' : 'You can now speak',
        });
      }
    }
  });

  const handleToggle = async () => {
    if (isConnected) {
      disconnect();
      setShowPanel(false);
    } else {
      setShowPanel(true);
      await connect();
    }
  };

  const statusText = {
    disconnected: language === 'ne' ? 'आवाज कुरा' : 'Voice Chat',
    connecting: language === 'ne' ? 'जोड्दैछ...' : 'Connecting...',
    connected: language === 'ne' ? 'सुन्दैछ...' : 'Listening...',
    speaking: language === 'ne' ? 'बोल्दैछ...' : 'Speaking...'
  };

  return (
    <>
      {/* Voice Chat Toggle Button */}
      <Button
        variant={isConnected ? "destructive" : "outline"}
        size="sm"
        onClick={handleToggle}
        className="gap-2"
        disabled={status === 'connecting'}
      >
        {status === 'connecting' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isConnected ? (
          <PhoneOff className="w-4 h-4" />
        ) : (
          <Phone className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{statusText[status]}</span>
      </Button>

      {/* Voice Chat Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 z-50 bg-card border border-border rounded-xl shadow-xl p-4 w-72"
          >
            <div className="text-center space-y-4">
              {/* Status Indicator */}
              <div className="relative w-20 h-20 mx-auto">
                <motion.div
                  className={`w-full h-full rounded-full flex items-center justify-center ${
                    isSpeaking 
                      ? 'bg-primary/20' 
                      : status === 'connected'
                      ? 'bg-success/20'
                      : status === 'connecting'
                      ? 'bg-warning/20'
                      : 'bg-muted'
                  }`}
                  animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  {isSpeaking ? (
                    <Volume2 className="w-8 h-8 text-primary" />
                  ) : status === 'connecting' ? (
                    <Loader2 className="w-8 h-8 text-warning animate-spin" />
                  ) : (
                    <Mic className={`w-8 h-8 ${status === 'connected' ? 'text-success' : 'text-muted-foreground'}`} />
                  )}
                </motion.div>
                
                {/* Pulse rings when speaking */}
                {isSpeaking && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/30"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/20"
                      animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                    />
                  </>
                )}
              </div>

              {/* Status Text */}
              <div>
                <p className="font-medium text-sm">
                  {statusText[status]}
                </p>
                {transcript && status === 'connected' && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    "{transcript}"
                  </p>
                )}
              </div>

              {/* Disconnect Button */}
              {isConnected && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    disconnect();
                    setShowPanel(false);
                  }}
                  className="w-full"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  {language === 'ne' ? 'बन्द गर्नुहोस्' : 'End Call'}
                </Button>
              )}

              {/* Help Text */}
              <p className="text-[10px] text-muted-foreground">
                {language === 'ne' 
                  ? 'नेपाली वा अंग्रेजीमा बोल्नुहोस्। AI ले सुनेर जवाफ दिनेछ।'
                  : 'Speak in Nepali or English. The AI will listen and respond.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
