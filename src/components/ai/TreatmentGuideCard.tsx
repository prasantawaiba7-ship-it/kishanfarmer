import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  PlayCircle, 
  ChevronDown, 
  ChevronUp, 
  Leaf, 
  FlaskConical,
  Clock,
  Calendar,
  IndianRupee,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

interface TreatmentStep {
  step_number: number;
  title: string;
  title_ne?: string;
  description: string;
  description_ne?: string;
}

interface CropTreatment {
  id: string;
  crop_name: string;
  disease_or_pest_name: string;
  disease_or_pest_name_ne: string | null;
  treatment_title: string;
  treatment_title_ne: string | null;
  treatment_steps: TreatmentStep[];
  chemical_treatment: string | null;
  chemical_treatment_ne: string | null;
  organic_treatment: string | null;
  organic_treatment_ne: string | null;
  youtube_video_url: string | null;
  severity_level: string;
  estimated_recovery_days: number | null;
  cost_estimate: string | null;
  best_season: string | null;
}

interface TreatmentGuideCardProps {
  cropName?: string;
  diseaseName?: string;
  autoExpand?: boolean;
}

export function TreatmentGuideCard({ 
  cropName, 
  diseaseName,
  autoExpand = false 
}: TreatmentGuideCardProps) {
  const { language } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, number[]>>({});

  // Fetch matching treatments
  const { data: treatments = [], isLoading } = useQuery({
    queryKey: ['treatment-guides', cropName, diseaseName],
    queryFn: async () => {
      let query = supabase
        .from('crop_treatments')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (cropName) {
        query = query.ilike('crop_name', `%${cropName}%`);
      }
      
      if (diseaseName) {
        query = query.or(`disease_or_pest_name.ilike.%${diseaseName}%,disease_or_pest_name_ne.ilike.%${diseaseName}%`);
      }

      const { data, error } = await query.limit(5);
      
      if (error) throw error;
      return data.map(t => ({
        ...t,
        treatment_steps: (t.treatment_steps as unknown as TreatmentStep[]) || []
      })) as CropTreatment[];
    },
    enabled: !!(cropName || diseaseName)
  });

  const getYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'medium': return 'bg-warning/10 text-warning border-warning/30';
      case 'low': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return language === 'ne' ? 'उच्च' : 'High';
      case 'medium': return language === 'ne' ? 'मध्यम' : 'Medium';
      case 'low': return language === 'ne' ? 'न्यून' : 'Low';
      default: return severity;
    }
  };

  const toggleStepComplete = (treatmentId: string, stepNumber: number) => {
    setCompletedSteps(prev => {
      const steps = prev[treatmentId] || [];
      if (steps.includes(stepNumber)) {
        return { ...prev, [treatmentId]: steps.filter(s => s !== stepNumber) };
      }
      return { ...prev, [treatmentId]: [...steps, stepNumber] };
    });
  };

  if (!cropName && !diseaseName) return null;
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-8">
          <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
        </CardContent>
      </Card>
    );
  }
  if (treatments.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <PlayCircle className="w-4 h-4" />
        <span>
          {language === 'ne' ? 'उपचार विधि गाइड' : 'Treatment Guide'}
        </span>
      </div>

      {treatments.map((treatment) => {
        const isExpanded = expandedId === treatment.id || (autoExpand && treatments.length === 1);
        const videoId = treatment.youtube_video_url ? getYouTubeVideoId(treatment.youtube_video_url) : null;
        const stepsCompleted = completedSteps[treatment.id] || [];
        const totalSteps = treatment.treatment_steps.length;
        const progress = totalSteps > 0 ? (stepsCompleted.length / totalSteps) * 100 : 0;

        return (
          <Card key={treatment.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {treatment.crop_name}
                    </Badge>
                    <Badge className={`text-xs ${getSeverityColor(treatment.severity_level)}`}>
                      {getSeverityLabel(treatment.severity_level)}
                    </Badge>
                    {videoId && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <PlayCircle className="w-3 h-3" />
                        {language === 'ne' ? 'भिडियो' : 'Video'}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base">
                    {language === 'ne' && treatment.disease_or_pest_name_ne 
                      ? treatment.disease_or_pest_name_ne 
                      : treatment.disease_or_pest_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'ne' && treatment.treatment_title_ne 
                      ? treatment.treatment_title_ne 
                      : treatment.treatment_title}
                  </p>
                </div>

                {videoId && (
                  <a 
                    href={treatment.youtube_video_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 relative w-24 h-16 rounded-lg overflow-hidden group"
                  >
                    <img 
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt="Video"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                  </a>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                {treatment.estimated_recovery_days && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {treatment.estimated_recovery_days} {language === 'ne' ? 'दिन' : 'days'}
                    </span>
                  </div>
                )}
                {treatment.cost_estimate && (
                  <div className="flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    <span>{treatment.cost_estimate}</span>
                  </div>
                )}
                {treatment.best_season && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{treatment.best_season}</span>
                  </div>
                )}
                {totalSteps > 0 && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {stepsCompleted.length}/{totalSteps} {language === 'ne' ? 'चरण' : 'steps'}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {totalSteps > 0 && progress > 0 && (
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() => setExpandedId(isExpanded ? null : treatment.id)}
              >
                <span className="text-sm">
                  {isExpanded 
                    ? (language === 'ne' ? 'कम देखाउनुहोस्' : 'Show less')
                    : (language === 'ne' ? 'विस्तृत हेर्नुहोस्' : 'View details')
                  }
                </span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-4">
                      {/* YouTube Video Embed */}
                      {videoId && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="Treatment Video"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}

                      {/* Step by Step Guide */}
                      {treatment.treatment_steps.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            {language === 'ne' ? 'चरणबद्ध निर्देशन' : 'Step-by-Step Guide'}
                          </h4>
                          <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                            {treatment.treatment_steps.map((step) => {
                              const isStepComplete = stepsCompleted.includes(step.step_number);
                              return (
                                <div 
                                  key={step.step_number}
                                  className={`flex gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                                    isStepComplete ? 'bg-success/10' : 'bg-muted/50 hover:bg-muted'
                                  }`}
                                  onClick={() => toggleStepComplete(treatment.id, step.step_number)}
                                >
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                    isStepComplete 
                                      ? 'bg-success text-success-foreground' 
                                      : 'bg-primary/10 text-primary'
                                  }`}>
                                    {isStepComplete ? '✓' : step.step_number}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`font-medium text-sm ${isStepComplete ? 'line-through opacity-70' : ''}`}>
                                      {language === 'ne' && step.title_ne ? step.title_ne : step.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {language === 'ne' && step.description_ne ? step.description_ne : step.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Chemical Treatment */}
                      {(treatment.chemical_treatment || treatment.chemical_treatment_ne) && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-warning" />
                            {language === 'ne' ? 'रासायनिक उपचार' : 'Chemical Treatment'}
                          </h4>
                          <p className="text-sm text-muted-foreground bg-warning/5 p-3 rounded-lg border border-warning/20">
                            {language === 'ne' && treatment.chemical_treatment_ne 
                              ? treatment.chemical_treatment_ne 
                              : treatment.chemical_treatment}
                          </p>
                        </div>
                      )}

                      {/* Organic Treatment */}
                      {(treatment.organic_treatment || treatment.organic_treatment_ne) && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-success" />
                            {language === 'ne' ? 'जैविक उपचार' : 'Organic Treatment'}
                          </h4>
                          <p className="text-sm text-muted-foreground bg-success/5 p-3 rounded-lg border border-success/20">
                            {language === 'ne' && treatment.organic_treatment_ne 
                              ? treatment.organic_treatment_ne 
                              : treatment.organic_treatment}
                          </p>
                        </div>
                      )}

                      {/* Watch on YouTube Button */}
                      {treatment.youtube_video_url && (
                        <a
                          href={treatment.youtube_video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
                        >
                          <PlayCircle className="w-5 h-5" />
                          {language === 'ne' ? 'YouTube मा हेर्नुहोस्' : 'Watch on YouTube'}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default TreatmentGuideCard;
