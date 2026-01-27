import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from './useLanguage';

export type GuideSection = 
  | 'introduction' 
  | 'climate' 
  | 'soil' 
  | 'land_preparation' 
  | 'sowing' 
  | 'fertilizer' 
  | 'irrigation' 
  | 'pests' 
  | 'diseases' 
  | 'harvest' 
  | 'storage' 
  | 'market' 
  | 'tips';

export interface CropGuide {
  id: string;
  crop_name: string;
  crop_id: number | null;
  section: GuideSection;
  title: string;
  title_ne: string | null;
  content: string;
  content_ne: string | null;
  display_order: number;
  step_number: number;
  media_url: string | null;
  version: number;
  is_active: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const SECTION_LABELS: Record<GuideSection, { en: string; ne: string; icon: string }> = {
  introduction: { en: 'Introduction', ne: 'परिचय', icon: '📖' },
  climate: { en: 'Climate & Season', ne: 'जलवायु र मौसम', icon: '🌤️' },
  soil: { en: 'Soil Preparation', ne: 'माटो तयारी', icon: '🏔️' },
  land_preparation: { en: 'Land Preparation', ne: 'भूमि तयारी', icon: '🚜' },
  sowing: { en: 'Sowing & Planting', ne: 'बिउ रोपाइँ', icon: '🌱' },
  fertilizer: { en: 'Fertilizer Management', ne: 'मल व्यवस्थापन', icon: '🧪' },
  irrigation: { en: 'Irrigation', ne: 'सिँचाइ', icon: '💧' },
  pests: { en: 'Pest Control', ne: 'कीरा नियन्त्रण', icon: '🐛' },
  diseases: { en: 'Disease Management', ne: 'रोग व्यवस्थापन', icon: '🦠' },
  harvest: { en: 'Harvesting', ne: 'कटानी', icon: '🌾' },
  storage: { en: 'Storage', ne: 'भण्डारण', icon: '🏠' },
  market: { en: 'Market & Pricing', ne: 'बजार र मूल्य', icon: '💰' },
  tips: { en: 'Tips & Tricks', ne: 'सुझाव', icon: '💡' },
};

export function useCropGuides(cropName?: string) {
  const { language } = useLanguage();
  const [guides, setGuides] = useState<CropGuide[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGuides = useCallback(async () => {
    try {
      let query = supabase
        .from('crop_guides')
        .select('*')
        .eq('is_active', true)
        .eq('is_published', true)
        .order('display_order', { ascending: true })
        .order('step_number', { ascending: true });

      if (cropName) {
        query = query.eq('crop_name', cropName);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Cast section to GuideSection type
      const typedData: CropGuide[] = (data || []).map(g => ({
        ...g,
        section: g.section as GuideSection
      }));
      
      setGuides(typedData);

      // Extract unique crop names
      const uniqueCrops = [...new Set(typedData.map(g => g.crop_name))];
      setCrops(uniqueCrops);
    } catch (error) {
      console.error('Error fetching guides:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cropName]);

  const getLocalizedContent = useCallback((guide: CropGuide) => {
    return {
      title: language === 'ne' && guide.title_ne ? guide.title_ne : guide.title,
      content: language === 'ne' && guide.content_ne ? guide.content_ne : guide.content,
    };
  }, [language]);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  return {
    guides,
    crops,
    isLoading,
    getLocalizedContent,
    refresh: fetchGuides,
  };
}
