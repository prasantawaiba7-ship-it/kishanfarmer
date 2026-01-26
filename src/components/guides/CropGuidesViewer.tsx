import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCropGuides, CropGuide, GuideSection, SECTION_LABELS } from '@/hooks/useCropGuides';
import { useLanguage } from '@/hooks/useLanguage';
import { useCrops } from '@/hooks/useCrops';
import { BookOpen, ChevronLeft, Search, Leaf, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CropGuidesViewer() {
  const { language } = useLanguage();
  const { guides, crops: guideCrops, isLoading, getLocalizedContent } = useCropGuides();
  const { activeCrops, cropsByCategory } = useCrops();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<GuideSection | null>(null);

  const filteredGuides = selectedCrop 
    ? guides.filter(g => g.crop_name === selectedCrop)
    : [];

  // Group guides by section
  const groupedGuides = filteredGuides.reduce((acc, guide) => {
    if (!acc[guide.section]) {
      acc[guide.section] = [];
    }
    acc[guide.section].push(guide);
    return acc;
  }, {} as Record<string, CropGuide[]>);

  // Get available sections for the selected crop
  const availableSections = (Object.keys(SECTION_LABELS) as GuideSection[])
    .filter(section => groupedGuides[section]?.length > 0);

  // Filter crops for display
  const filteredCrops = guideCrops.filter(crop => 
    crop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get crop image from crops table if available
  const getCropImage = (cropName: string) => {
    const crop = activeCrops.find(c => 
      c.name_ne === cropName || c.name_en.toLowerCase() === cropName.toLowerCase()
    );
    return crop?.image_url;
  };

  // Get crop category
  const getCropCategory = (cropName: string) => {
    const crop = activeCrops.find(c => 
      c.name_ne === cropName || c.name_en.toLowerCase() === cropName.toLowerCase()
    );
    return crop?.category || 'other';
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'vegetable': return '🥬';
      case 'fruit': return '🍎';
      case 'grain': return '🌾';
      case 'spice': return '🌶️';
      case 'pulse': return '🫘';
      default: return '🌿';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {language === 'ne' ? 'लोड हुँदैछ...' : 'Loading guides...'}
        </p>
      </div>
    );
  }

  if (guideCrops.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {language === 'ne' ? 'कुनै गाइड उपलब्ध छैन' : 'No Guides Available'}
          </h3>
          <p className="text-muted-foreground">
            {language === 'ne' 
              ? 'Admin ले खेती गाइड थप्नु पर्छ।' 
              : 'Admin needs to add crop guides.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Crop selection screen
  if (!selectedCrop) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Leaf className="h-5 w-5" />
            <span className="font-medium">
              {language === 'ne' ? 'खेती गाइड' : 'Farming Guide'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {language === 'ne' ? 'बाली छान्नुहोस्' : 'Select a Crop'}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {language === 'ne' 
              ? 'तपाईंले खेती गर्न चाहनुभएको बालीको पूर्ण गाइड हेर्नुहोस्'
              : 'View complete farming guide for your chosen crop'}
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={language === 'ne' ? 'बाली खोज्नुहोस्...' : 'Search crops...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Crops Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCrops.map((crop, index) => {
              const cropGuides = guides.filter(g => g.crop_name === crop);
              const category = getCropCategory(crop);
              const imageUrl = getCropImage(crop);
              
              return (
                <motion.div
                  key={crop}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card 
                    className="cursor-pointer group hover:shadow-lg hover:border-primary/50 transition-all duration-300 overflow-hidden"
                    onClick={() => {
                      setSelectedCrop(crop);
                      setActiveSection(null);
                    }}
                  >
                    {/* Image or Emoji Header */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center relative overflow-hidden">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={crop}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-5xl group-hover:scale-110 transition-transform">
                          {getCategoryEmoji(category)}
                        </span>
                      )}
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 right-2 text-xs"
                      >
                        {cropGuides.length} {language === 'ne' ? 'विषय' : 'topics'}
                      </Badge>
                    </div>
                    
                    <CardContent className="p-3 md:p-4">
                      <h3 className="font-semibold text-center line-clamp-1 group-hover:text-primary transition-colors">
                        {crop}
                      </h3>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredCrops.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {language === 'ne' ? 'कुनै बाली फेला परेन' : 'No crops found'}
          </div>
        )}
      </motion.div>
    );
  }

  // Guide detail view
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedCrop(null)}
          className="self-start"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {language === 'ne' ? 'फिर्ता' : 'Back'}
        </Button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            {getCropImage(selectedCrop) ? (
              <img 
                src={getCropImage(selectedCrop)} 
                alt={selectedCrop}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span className="text-2xl">{getCategoryEmoji(getCropCategory(selectedCrop))}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{selectedCrop}</h1>
            <p className="text-sm text-muted-foreground">
              {availableSections.length} {language === 'ne' ? 'खण्डहरू उपलब्ध' : 'sections available'}
            </p>
          </div>
        </div>
      </div>

      {filteredGuides.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{language === 'ne' ? 'यो बालीको लागि गाइड उपलब्ध छैन।' : 'No guide available for this crop.'}</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs 
          value={activeSection || availableSections[0]} 
          onValueChange={(v) => setActiveSection(v as GuideSection)}
          className="w-full"
        >
          {/* Scrollable Tabs */}
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <TabsList className="inline-flex h-auto p-1 bg-muted/50">
              {availableSections.map((section) => {
                const label = SECTION_LABELS[section];
                return (
                  <TabsTrigger 
                    key={section} 
                    value={section}
                    className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <span>{label.icon}</span>
                    <span className="hidden sm:inline">
                      {language === 'ne' ? label.ne : label.en}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Tab Contents */}
          {availableSections.map((section) => {
            const sectionGuides = groupedGuides[section] || [];
            const label = SECTION_LABELS[section];
            
            return (
              <TabsContent key={section} value={section} className="mt-4">
                <Card>
                  <CardContent className="p-4 md:p-6">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                        {label.icon}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">
                          {language === 'ne' ? label.ne : label.en}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {sectionGuides.length} {language === 'ne' ? 'चरणहरू' : 'steps'}
                        </p>
                      </div>
                    </div>

                    {/* Guide Steps */}
                    <div className="space-y-6">
                      {sectionGuides.map((guide, idx) => {
                        const { title, content } = getLocalizedContent(guide);
                        return (
                          <motion.div 
                            key={guide.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative pl-8 pb-6 last:pb-0"
                          >
                            {/* Step indicator line */}
                            {idx < sectionGuides.length - 1 && (
                              <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border" />
                            )}
                            
                            {/* Step number */}
                            <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                              {idx + 1}
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                              <h3 className="font-semibold text-base md:text-lg">
                                {title}
                              </h3>
                              <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                                {content}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </motion.div>
  );
}
