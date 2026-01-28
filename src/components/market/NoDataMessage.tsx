import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface NoDataMessageProps {
  variant?: 'inline' | 'card' | 'compact';
  className?: string;
}

export function NoDataMessage({ variant = 'inline', className = '' }: NoDataMessageProps) {
  const { language } = useLanguage();
  const isNepali = language === 'ne';

  const primaryText = isNepali 
    ? 'यस बालीको मूल्य डाटा उपलब्ध छैन।'
    : 'No price data available for this crop.';
  
  const secondaryText = isNepali
    ? 'AMPIS/कालीमाटी API जडान भएपछि स्वचालित अपडेट हुनेछ।'
    : 'Data will update automatically when AMPIS/Kalimati API is connected.';

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <AlertCircle className="h-4 w-4 flex-shrink-0 opacity-60" />
        <span className="text-xs leading-tight">{primaryText}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/20 ${className}`}>
        <div className="flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">
              {primaryText}
            </p>
            <p className="text-[10px] text-muted-foreground/70 leading-tight">
              {secondaryText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // inline variant (default)
  return (
    <div className={`text-center ${className}`}>
      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground mb-1">
        {primaryText}
      </p>
      <p className="text-xs text-muted-foreground/70">
        {secondaryText}
      </p>
    </div>
  );
}

// Standalone no-data product card for grid displays
interface NoDataProductCardProps {
  cropName: string;
  cropNameNe?: string;
  imageUrl?: string | null;
}

export function NoDataProductCard({ cropName, cropNameNe, imageUrl }: NoDataProductCardProps) {
  const { language } = useLanguage();
  const isNepali = language === 'ne';
  const displayName = (isNepali && cropNameNe) ? cropNameNe : cropName;

  return (
    <div className="overflow-hidden border border-dashed border-muted-foreground/20 rounded-xl bg-muted/20 opacity-70">
      <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="object-cover w-full h-full grayscale opacity-50"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground line-clamp-1">
          {displayName}
        </h3>
        <NoDataMessage variant="compact" />
      </div>
    </div>
  );
}
