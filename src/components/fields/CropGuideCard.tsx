import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { getCropImageUrl, handleCropImageError } from '@/lib/cropPlaceholder';
import { useLanguage } from '@/hooks/useLanguage';

interface GuideSection {
  id: string;
  section: string;
  title: string;
  title_ne: string | null;
  content: string;
  content_ne: string | null;
  step_number: number;
  media_url: string | null;
}

interface CropGuideCardProps {
  cropId: number;
  cropName: string;
  cropNameEn?: string;
  cropImage?: string | null;
  autoLoad?: boolean;
}

export function CropGuideCard({ cropId, cropName, cropNameEn, cropImage, autoLoad = false }: CropGuideCardProps) {
  const { t, language } = useLanguage();
  const resolvedCropImage = getCropImageUrl(cropImage);
  const [stage, setStage] = useState('general');
  const [problemType, setProblemType] = useState('general');
  const [customQuestion, setCustomQuestion] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [sections, setSections] = useState<Record<string, GuideSection[]>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const STAGE_OPTIONS = [
    { value: 'general', labelKey: 'stageGeneral' },
    { value: 'before_sowing', labelKey: 'stageBeforeSowing' },
    { value: 'sowing', labelKey: 'stageSowing' },
    { value: 'seedling', labelKey: 'stageSeedling' },
    { value: 'vegetative', labelKey: 'stageVegetative' },
    { value: 'flowering', labelKey: 'stageFlowering' },
    { value: 'fruiting', labelKey: 'stageFruiting' },
    { value: 'pre_harvest', labelKey: 'stagePreHarvest' },
    { value: 'post_harvest', labelKey: 'stagePostHarvest' },
  ];

  const PROBLEM_OPTIONS = [
    { value: 'general', labelKey: 'problemGeneral' },
    { value: 'disease', labelKey: 'problemDisease' },
    { value: 'pest', labelKey: 'problemPest' },
    { value: 'fertilizer', labelKey: 'problemFertilizer' },
    { value: 'irrigation', labelKey: 'problemIrrigation' },
    { value: 'weather', labelKey: 'problemWeather' },
    { value: 'market', labelKey: 'problemMarket' },
  ];

  const fetchGuide = async () => {
    setIsLoading(true); setError(null); setSummary(null); setSteps([]); setSections({});
    try {
      const { data, error: apiError } = await supabase.functions.invoke('guide-query', {
        body: {
          crop_id: cropId,
          stage: stage !== 'general' ? stage : undefined,
          problem_type: problemType !== 'general' ? problemType : undefined,
          question: customQuestion.trim() || undefined,
          language,
        },
      });
      if (apiError) throw apiError;
      if (data?.error && !data?.sections) { setError(data.error); return; }
      setSummary(data?.summary || null);
      setSteps(data?.steps || []);
      setSections(data?.sections || {});
      const firstSection = Object.keys(data?.sections || {})[0];
      if (firstSection) setExpandedSections(new Set([firstSection]));
    } catch (err) {
      console.error('Guide fetch error:', err);
      setError(t('guideFailed'));
      toast.error(t('guideLoadFailed'));
    } finally { setIsLoading(false); }
  };

  useEffect(() => { if (autoLoad && cropId) fetchGuide(); }, [autoLoad, cropId]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) newExpanded.delete(section); else newExpanded.add(section);
    setExpandedSections(newExpanded);
  };

  const getSectionLabel = (section: string) => {
    const labels: Record<string, { label: string; icon: string }> = {
      introduction: { label: language === 'ne' ? 'परिचय' : 'Introduction', icon: '📖' },
      climate: { label: language === 'ne' ? 'जलवायु' : 'Climate', icon: '🌤️' },
      soil: { label: language === 'ne' ? 'माटो' : 'Soil', icon: '🏔️' },
      land_preparation: { label: language === 'ne' ? 'भूमि तयारी' : 'Land Preparation', icon: '🚜' },
      sowing: { label: language === 'ne' ? 'रोपाइँ' : 'Sowing', icon: '🌱' },
      fertilizer: { label: language === 'ne' ? 'मल' : 'Fertilizer', icon: '🧪' },
      irrigation: { label: language === 'ne' ? 'सिँचाइ' : 'Irrigation', icon: '💧' },
      pests: { label: language === 'ne' ? 'किरा' : 'Pests', icon: '🐛' },
      diseases: { label: language === 'ne' ? 'रोग' : 'Diseases', icon: '🦠' },
      harvest: { label: language === 'ne' ? 'कटानी' : 'Harvest', icon: '🌾' },
      storage: { label: language === 'ne' ? 'भण्डारण' : 'Storage', icon: '🏠' },
      market: { label: language === 'ne' ? 'बजार' : 'Market', icon: '💰' },
      tips: { label: language === 'ne' ? 'सुझाव' : 'Tips', icon: '💡' },
    };
    return labels[section] || { label: section, icon: '📄' };
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <div className="flex items-center gap-3">
          <img src={resolvedCropImage} alt={cropName} className="w-12 h-12 rounded-lg object-cover" onError={handleCropImageError} />
          <div className="flex-1">
            <CardTitle className="text-lg">{cropName}</CardTitle>
            {cropNameEn && <p className="text-sm text-muted-foreground">{cropNameEn}</p>}
          </div>
          <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" />{t('aiGuide')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">{t('stageLabel')}</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background">
                {STAGE_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t('topicLabel')}</Label>
            <Select value={problemType} onValueChange={setProblemType}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background">
                {PROBLEM_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full gap-1 text-xs">
              <MessageSquare className="h-3 w-3" />{t('askMoreQuestion')}
              {showAdvancedOptions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Textarea placeholder={t('questionPlaceholder')} value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} className="min-h-[60px] text-sm" />
          </CollapsibleContent>
        </Collapsible>
        <Button onClick={fetchGuide} disabled={isLoading} className="w-full gap-2">
          {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />{t('loadingGuide')}</>) : summary ? (<><RefreshCw className="h-4 w-4" />{t('reloadGuide')}</>) : (<><BookOpen className="h-4 w-4" />{t('viewGuide')}</>)}
        </Button>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" /><p className="text-sm">{error}</p>
          </div>
        )}
        <AnimatePresence>
          {summary && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">{t('aiSummary')}</span>
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{summary}</div>
              </div>
              {steps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" />{t('whatToDo')}</h4>
                  <ul className="space-y-1.5">{steps.map((step, idx) => (<li key={idx} className="flex items-start gap-2 text-sm"><span className="font-medium text-primary">{idx + 1}.</span><span>{step}</span></li>))}</ul>
                </div>
              )}
              {Object.keys(sections).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">{t('detailedInfo')}</h4>
                  {Object.entries(sections).map(([sectionKey, sectionGuides]) => {
                    const { label, icon } = getSectionLabel(sectionKey);
                    const isExpanded = expandedSections.has(sectionKey);
                    return (
                      <Collapsible key={sectionKey} open={isExpanded} onOpenChange={() => toggleSection(sectionKey)}>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                            <span className="flex items-center gap-2 font-medium text-sm"><span>{icon}</span>{label}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{sectionGuides.length}</Badge>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-3 space-y-3">
                            {sectionGuides.map((guide) => (
                              <div key={guide.id} className="text-sm">
                                <h5 className="font-medium mb-1">{language === 'ne' ? (guide.title_ne || guide.title) : (guide.title || guide.title_ne)}</h5>
                                <p className="text-muted-foreground whitespace-pre-wrap">{language === 'ne' ? (guide.content_ne || guide.content) : (guide.content || guide.content_ne)}</p>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
