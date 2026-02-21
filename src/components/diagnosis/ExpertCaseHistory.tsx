import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CheckCircle, ChevronDown, ChevronUp, 
  User, Bot, Leaf, AlertCircle, MessageSquare, Loader2, Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useMyDiagnosisCases, useSubmitDiagnosisCase, type DiagnosisCaseWithDetails } from '@/hooks/useDiagnosisCases';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type DiagnosisCaseStatus = Database['public']['Enums']['diagnosis_case_status'];

const STATUS_MAP: Record<DiagnosisCaseStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'नयाँ', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Clock className="w-3 h-3" /> },
  ai_suggested: { label: 'AI हेर्दै', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Bot className="w-3 h-3" /> },
  expert_pending: { label: 'विज्ञ हेर्दै', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock className="w-3 h-3" /> },
  expert_answered: { label: 'जवाफ आयो! ✅', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" /> },
  closed: { label: 'बन्द', color: 'bg-muted text-muted-foreground border-border', icon: <CheckCircle className="w-3 h-3" /> },
};

function ExpertCaseCard({ caseData }: { caseData: DiagnosisCaseWithDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useLanguage();

  const status = STATUS_MAP[caseData.case_status];
  const finalSuggestion = caseData.suggestions.find(s => s.is_final);
  const aiSuggestion = caseData.suggestions.find(s => s.source_type === 'rule_engine');
  const cropName = language === 'ne' ? caseData.crops?.name_ne : caseData.crops?.name_en;

  return (
    <Card className="overflow-hidden border-border/40">
      <div
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          {caseData.images[0] && (
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-border/30">
              <img src={caseData.images[0].image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={`text-xs ${status.color} border`}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="font-medium text-sm text-foreground">
              {cropName || 'बाली'}
            </p>
            {caseData.farmer_question && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {caseData.farmer_question.slice(0, 60)}
              </p>
            )}
          </div>

          <Button variant="ghost" size="icon" className="flex-shrink-0 w-8 h-8">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 pb-4 space-y-4 px-4">
              {/* All photos */}
              {caseData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {caseData.images.map((img) => (
                    <div key={img.id} className="aspect-square rounded-xl overflow-hidden border border-border/30">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Case ID */}
              <p className="text-xs text-muted-foreground">
                केस: <span className="font-mono">KS-{caseData.id.slice(0, 8).toUpperCase()}</span>
              </p>

              {/* AI preliminary hint */}
              {aiSuggestion && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">AI प्रारम्भिक अनुमान</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">प्रारम्भिक</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">{aiSuggestion.suspected_problem}</p>
                  <p className="text-xs text-muted-foreground mt-1">{aiSuggestion.advice_text}</p>
                </div>
              )}

              {/* Expert Answer */}
              {finalSuggestion ? (
                <div className="p-4 bg-success/5 border-2 border-success/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-success" />
                    </div>
                    <span className="text-sm font-semibold text-success">कृषि विज्ञको जवाफ</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {finalSuggestion.suspected_problem}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {finalSuggestion.advice_text}
                  </p>

                  {/* Follow-up box */}
                  <div className="mt-3 pt-3 border-t border-success/20">
                    <FollowUpBox caseId={caseData.id} cropId={caseData.crop_id} />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl text-center">
                  <Clock className="w-6 h-6 mx-auto text-warning mb-2" />
                  <p className="text-sm font-medium text-foreground">विज्ञको जवाफ पर्खिरहेको छ</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    औसत जवाफ समय: लगभग २४ घण्टा
                  </p>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function FollowUpBox({ caseId, cropId }: { caseId: string; cropId: number | null }) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const submitCase = useSubmitDiagnosisCase();

  // Note: Follow-up creates a new linked case for simplicity
  const handleFollowUp = async () => {
    if (!text.trim() || !cropId) return;
    setIsSending(true);
    try {
      await submitCase.mutateAsync({
        cropId,
        farmerQuestion: `[थप प्रश्न - केस ${caseId.slice(0, 8)}] ${text}`,
        images: [],
      });
      setText('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Textarea
        placeholder="थप प्रश्न सोध्नुहोस्..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={1}
        className="resize-none text-sm flex-1 min-h-[36px]"
      />
      <Button
        size="icon"
        className="flex-shrink-0 h-9 w-9"
        disabled={!text.trim() || isSending}
        onClick={handleFollowUp}
      >
        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  );
}

export function ExpertCaseHistory() {
  const { user } = useAuth();
  const { data: cases, isLoading } = useMyDiagnosisCases();

  if (!user) {
    return (
      <Card className="border-border/40">
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            आफ्ना प्रश्नहरू हेर्न लगइन गर्नुहोस्
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          मेरा प्रश्नहरू
        </h2>
        {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        मेरा प्रश्नहरू
      </h2>

      {cases && cases.length > 0 ? (
        <div className="space-y-3">
          {cases.map(caseData => (
            <ExpertCaseCard key={caseData.id} caseData={caseData} />
          ))}
        </div>
      ) : (
        <Card className="border-border/40">
          <CardContent className="py-8 text-center">
            <Leaf className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              अहिलेसम्म कुनै प्रश्न पठाइएको छैन
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              माथिको फारम भर्नुहोस् र विज्ञलाई पठाउनुहोस्
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
