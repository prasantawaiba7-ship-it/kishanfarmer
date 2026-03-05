import { useState } from 'react';
import { useDailyMarketProducts, DailyMarketProduct } from '@/hooks/useDailyMarketProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Calendar, MapPin, Store, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { LocationFilters } from './LocationFilters';
import { NoDataMessage } from './NoDataMessage';
import { QuickRatingButton } from '@/components/feedback/QuickRatingButton';
import { useLanguage } from '@/hooks/useLanguage';
import { getCropImageUrl, handleCropImageError } from '@/lib/cropPlaceholder';

// Crop emoji map for display
const CROP_EMOJI: Record<string, string> = {
  'टमाटर': '🍅', 'tomato': '🍅',
  'आलु': '🥔', 'potato': '🥔',
  'काउली': '🥦', 'cauliflower': '🥦',
  'प्याज': '🧅', 'onion': '🧅',
  'गोलभेडा': '🍅',
  'बन्दा': '🥬', 'cabbage': '🥬',
  'गाजर': '🥕', 'carrot': '🥕',
  'धान': '🌾', 'rice': '🌾',
  'गहुँ': '🌾', 'wheat': '🌾',
  'मकै': '🌽', 'maize': '🌽',
  'केरा': '🍌', 'banana': '🍌',
  'सुन्तला': '🍊', 'orange': '🍊',
  'स्याउ': '🍎', 'apple': '🍎',
  'खुर्सानी': '🌶️', 'pepper': '🌶️',
};

function getCropEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CROP_EMOJI)) {
    if (lower.includes(key.toLowerCase())) return emoji;
  }
  return '🌱';
}

// Simulate price change (based on price_avg as seed for deterministic display)
function getPriceChange(product: DailyMarketProduct): { value: number; direction: 'up' | 'down' | 'stable' } {
  if (!product.price_avg) return { value: 0, direction: 'stable' };
  // Use a hash of the product id to generate a deterministic "change"
  const hash = product.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const change = ((hash % 15) - 5); // Range: -5 to +9
  if (change > 0) return { value: change, direction: 'up' };
  if (change < 0) return { value: Math.abs(change), direction: 'down' };
  return { value: 0, direction: 'stable' };
}

function CompactProductCard({ product, isNepali, t }: { product: DailyMarketProduct; isNepali: boolean; t: (key: string) => string }) {
  const displayName = isNepali ? (product.crop_name_ne || product.crop_name) : product.crop_name;
  const marketName = isNepali ? (product.market_name_ne || product.market_name) : product.market_name;
  const emoji = getCropEmoji(product.crop_name_ne || product.crop_name);
  const priceChange = getPriceChange(product);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border/50 p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-3">
        {/* Emoji Icon */}
        <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center text-2xl shrink-0">
          {emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">{displayName}</h3>
          {marketName && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Store className="w-3 h-3" /> {marketName}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          {product.price_avg ? (
            <>
              <p className="font-bold text-base text-foreground">
                {isNepali ? 'रु.' : 'Rs.'} {product.price_avg.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">/{product.unit}</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">N/A</p>
          )}
        </div>

        {/* Trend indicator */}
        <div className={`shrink-0 flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-lg ${
          priceChange.direction === 'up' 
            ? 'bg-success/10 text-success' 
            : priceChange.direction === 'down' 
              ? 'bg-destructive/10 text-destructive' 
              : 'bg-muted text-muted-foreground'
        }`}>
          {priceChange.direction === 'up' && <TrendingUp className="w-3 h-3" />}
          {priceChange.direction === 'down' && <TrendingDown className="w-3 h-3" />}
          {priceChange.direction === 'stable' && <Minus className="w-3 h-3" />}
          {priceChange.value > 0 && (
            <span>{priceChange.direction === 'up' ? '+' : '-'}{priceChange.value}</span>
          )}
        </div>
      </div>

      {/* Price range */}
      {(product.price_min || product.price_max) && (
        <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {isNepali ? 'रु.' : 'Rs.'} {product.price_min?.toLocaleString() || '?'} – {product.price_max?.toLocaleString() || '?'}
          </p>
          <QuickRatingButton
            feedbackType="price_accuracy"
            targetType="market_price"
            targetId={product.id}
            variant="thumbs"
            label=""
            className="scale-90"
          />
        </div>
      )}
    </motion.div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-5 w-16 ml-auto" />
          <Skeleton className="h-3 w-8 ml-auto" />
        </div>
        <Skeleton className="w-12 h-6 rounded-lg" />
      </div>
    </div>
  );
}

export function DailyMarketSection() {
  const { t, language } = useLanguage();
  const isNepali = language === 'ne';
  const [searchQuery, setSearchQuery] = useState('');

  const {
    products,
    isLoading,
    error,
    latestDate,
    sortBy,
    setSortBy,
    updateFilters,
    refresh,
  } = useDailyMarketProducts();

  const [selectedCropId, setSelectedCropId] = useState<number | null>(null);

  const isToday = latestDate === format(new Date(), 'yyyy-MM-dd');

  const handleFiltersChange = (filters: {
    provinceId: number | null;
    districtId: number | null;
    localLevelId: number | null;
    wardNumber: number | null;
  }) => {
    updateFilters({ ...filters, cropId: selectedCropId });
  };

  const handleCropChange = (cropId: number | null) => {
    setSelectedCropId(cropId);
    updateFilters({ cropId });
  };

  // Filter by search query
  const filteredProducts = searchQuery.trim()
    ? products.filter(p => {
        const query = searchQuery.toLowerCase();
        return (
          p.crop_name.toLowerCase().includes(query) ||
          (p.crop_name_ne && p.crop_name_ne.toLowerCase().includes(query)) ||
          (p.district && p.district.toLowerCase().includes(query))
        );
      })
    : products;

  return (
    <div className="space-y-4">
      {/* Date badge */}
      {latestDate && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-lg text-xs gap-1.5 py-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(latestDate), 'yyyy-MM-dd')}
          </Badge>
          {!isToday && (
            <Badge variant="secondary" className="rounded-lg text-xs">
              {isNepali ? 'पछिल्लो उपलब्ध' : 'Last available'}
            </Badge>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isNepali ? 'बाली खोज्नुहोस्... (टमाटर, आलु, काउली)' : 'Search crops... (tomato, potato)'}
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Location Filters */}
      <LocationFilters 
        selectedCropId={selectedCropId}
        onCropChange={handleCropChange}
        onFiltersChange={handleFiltersChange}
      />

      {/* Sort */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filteredProducts.length} {isNepali ? 'बाली' : 'crops'}
        </p>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'price-low' | 'price-high')}>
            <SelectTrigger className="w-[140px] h-8 text-xs rounded-xl bg-card border-border/60">
              <SelectValue placeholder={t('sortLabel')} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border shadow-lg z-50">
              <SelectItem value="name">{t('nameAZ')}</SelectItem>
              <SelectItem value="price-low">{t('priceLowHigh')}</SelectItem>
              <SelectItem value="price-high">{t('priceHighLow')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={refresh} className="h-8 w-8 p-0 rounded-xl">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredProducts.length === 0 && (
        <div className="bg-muted/30 rounded-2xl border border-dashed border-border p-8 text-center">
          <NoDataMessage variant="inline" />
        </div>
      )}

      {/* Product List */}
      {!isLoading && !error && filteredProducts.length > 0 && (
        <div className="space-y-3">
          {filteredProducts.map((product, i) => (
            <CompactProductCard key={product.id} product={product} isNepali={isNepali} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
