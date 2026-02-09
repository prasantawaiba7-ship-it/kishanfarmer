import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyMarketSection } from '@/components/market/DailyMarketSection';
import { IndiaMandiPrices } from '@/components/market/IndiaMandiPrices';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, Navigation, Store
} from 'lucide-react';

type TabValue = 'mandi' | 'daily';

const MarketPage = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabValue) || 'mandi';
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabValue;
    if (tabParam && ['mandi', 'daily'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <>
      <Helmet>
        <title>मंडी भाव - Market | किसान साथी</title>
        <meta name="description" content="आज का मंडी भाव देखें, अपनी उपज बेचें, और खरीदारों से जुड़ें।" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 sm:pt-24 pb-28">
          <div className="container mx-auto px-4">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
                  <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    मंडी भाव
                  </h1>
                  <p className="text-sm text-muted-foreground">आज का भाव देखें, उपज बेचें</p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger 
                  value="mandi" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>मंडी भाव</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="daily" 
                  className="gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-1"
                >
                  <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>दैनिक मूल्य</span>
                </TabsTrigger>
              </TabsList>

              {/* India Mandi Prices Tab */}
              <TabsContent value="mandi">
                <IndiaMandiPrices />
              </TabsContent>

              {/* Daily Prices Tab */}
              <TabsContent value="daily">
                <DailyMarketSection />
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MarketPage;
