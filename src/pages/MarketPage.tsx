import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyMarketSection } from '@/components/market/DailyMarketSection';
import { AllNepalPriceComparison } from '@/components/market/AllNepalPriceComparison';
import { UserMarketCardsSection } from '@/components/market/UserMarketCardsSection';
import { MarketSelectionFlow } from '@/components/market/MarketSelectionFlow';
import { NearestMarketsSection } from '@/components/market/NearestMarketsSection';
import { RealTimePriceUpdates } from '@/components/market/RealTimePriceUpdates';
import { useLanguage } from '@/hooks/useLanguage';
import { FarmerBottomNav } from '@/components/layout/FarmerBottomNav';
import { 
  TrendingUp, Navigation, Users, Store, Search, Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';

type TabValue = 'daily' | 'nearby' | 'community';

const MarketPage = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabValue) || 'daily';
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const { t, language } = useLanguage();
  const isNepali = language === 'ne';

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabValue;
    if (tabParam && ['daily', 'nearby', 'community'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Farmer tip of the day
  const farmerTips = [
    isNepali ? 'आज टमाटरको मूल्य बढेको छ। बिक्री गर्न उपयुक्त समय।' : 'Tomato prices are up today. Good time to sell.',
    isNepali ? 'आलुको भाउ स्थिर छ। भण्डार गर्न सकिन्छ।' : 'Potato prices are stable. Safe to store.',
    isNepali ? 'बजार भाउ हेरेर मात्र बिक्री गर्नुहोस्।' : 'Check market prices before selling.',
  ];
  const todayTip = farmerTips[new Date().getDay() % farmerTips.length];

  return (
    <>
      <Helmet>
        <title>{isNepali ? 'कृषि बजार' : 'Agri Market'} | Kisan Sathi</title>
        <meta name="description" content={isNepali ? 'आजको ताजा कृषि बजार भाउ' : 'Today\'s fresh agriculture market prices'} />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="px-4 py-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground leading-tight">
                    📊 {isNepali ? 'कृषि बजार' : 'Agri Market'}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {isNepali ? 'आजको ताजा कृषि बजार भाउ' : "Today's fresh market prices"}
                  </p>
                </div>
              </div>
              <RealTimePriceUpdates />
            </div>
          </div>
        </div>

        <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
          {/* Market Selection */}
          <MarketSelectionFlow />

          {/* Farmer Tip Card */}
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-accent/10 rounded-2xl border border-accent/20 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-accent-foreground mb-0.5">
                💡 {isNepali ? 'आजको सुझाव' : "Today's Tip"}
              </p>
              <p className="text-sm text-foreground leading-relaxed">{todayTip}</p>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <TabsList className="grid w-full grid-cols-3 h-11 p-1 bg-muted/60 rounded-2xl">
              <TabsTrigger 
                value="daily" 
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-xs sm:text-sm gap-1.5 font-medium"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {isNepali ? 'भाउ' : 'Prices'}
              </TabsTrigger>
              <TabsTrigger 
                value="nearby" 
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-xs sm:text-sm gap-1.5 font-medium"
              >
                <Navigation className="h-3.5 w-3.5" />
                {isNepali ? 'नजिक' : 'Nearby'}
              </TabsTrigger>
              <TabsTrigger 
                value="community" 
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-xs sm:text-sm gap-1.5 font-medium"
              >
                <Users className="h-3.5 w-3.5" />
                {isNepali ? 'किसान' : 'Farmers'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="mt-4">
              <DailyMarketSection />
            </TabsContent>

            <TabsContent value="nearby" className="mt-4">
              <NearestMarketsSection />
            </TabsContent>

            <TabsContent value="community" className="mt-4">
              <UserMarketCardsSection />
            </TabsContent>
          </Tabs>
        </main>

        <FarmerBottomNav />
      </div>
    </>
  );
};

export default MarketPage;
