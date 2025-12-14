import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sprout, TrendingUp, Droplets, Clock, ChevronDown, ChevronUp, Sparkles, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/hooks/useLanguage';

interface CropRecommendation {
  crop: string;
  suitabilityScore: number;
  expectedYieldPerHectare: string;
  estimatedProfitPerHectare: string;
  waterRequirement: 'low' | 'medium' | 'high';
  growthDuration: string;
  bestPractices: string[];
  inputsNeeded: {
    seeds: string;
    fertilizer: string;
    irrigation: string;
  };
}

interface Props {
  recommendation: CropRecommendation;
  rank: number;
}

export function CropRecommendationCard({ recommendation, rank }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  const waterColors = {
    low: 'text-green-500 bg-green-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    high: 'text-blue-500 bg-blue-500/10'
  };

  const rankBadges = ['🥇', '🥈', '🥉', '4th', '5th'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{rankBadges[rank] || `#${rank + 1}`}</div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-primary" />
                  {recommendation.crop}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={waterColors[recommendation.waterRequirement]}>
                    <Droplets className="w-3 h-3 mr-1" />
                    {recommendation.waterRequirement}
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {recommendation.growthDuration}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Suitability</div>
              <div className="text-2xl font-bold text-primary">
                {Math.round(recommendation.suitabilityScore * 100)}%
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Progress 
            value={recommendation.suitabilityScore * 100} 
            className="h-2"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-xs text-muted-foreground">Expected Yield</div>
                <div className="font-semibold text-sm">{recommendation.expectedYieldPerHectare}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <IndianRupee className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-xs text-muted-foreground">Est. Profit/ha</div>
                <div className="font-semibold text-sm">{recommendation.estimatedProfitPerHectare}</div>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t('viewDetails')}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-2 border-t"
            >
              <div>
                <h4 className="font-semibold text-sm mb-2">📋 Inputs Required</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Seeds:</span>
                    <span className="font-medium">{recommendation.inputsNeeded.seeds}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Fertilizer:</span>
                    <span className="font-medium">{recommendation.inputsNeeded.fertilizer}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Irrigation:</span>
                    <span className="font-medium">{recommendation.inputsNeeded.irrigation}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">💡 Best Practices</h4>
                <ul className="space-y-1">
                  {recommendation.bestPractices.map((practice, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {practice}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
