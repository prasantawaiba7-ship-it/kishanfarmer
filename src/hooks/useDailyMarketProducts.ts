import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyMarketProduct {
  id: string;
  date: string;
  crop_name: string;
  crop_name_ne: string | null;
  image_url: string | null;
  unit: string;
  price_min: number | null;
  price_max: number | null;
  price_avg: number | null;
  market_name: string | null;
  market_name_ne: string | null;
  district: string | null;
  source: string | null;
  created_at: string;
  // New fields
  province_id: number | null;
  district_id_fk: number | null;
  local_level_id: number | null;
  ward_number: number | null;
  crop_id: number | null;
}

interface FilterParams {
  provinceId?: number | null;
  districtId?: number | null;
  localLevelId?: number | null;
  wardNumber?: number | null;
  cropId?: number | null;
}

export function useDailyMarketProducts() {
  const [products, setProducts] = useState<DailyMarketProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string | null>(null);

  // Legacy filters (for backward compatibility)
  const [districts, setDistricts] = useState<string[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name');

  // New location-based filters
  const [filterParams, setFilterParams] = useState<FilterParams>({});

  const fetchProducts = useCallback(async (params?: FilterParams) => {
    setIsLoading(true);
    setError(null);

    try {
      // First, get the latest date available
      const { data: dateData, error: dateError } = await supabase
        .from('daily_market_products')
        .select('date')
        .order('date', { ascending: false })
        .limit(1);

      if (dateError) throw dateError;

      if (!dateData || dateData.length === 0) {
        setProducts([]);
        setLatestDate(null);
        return;
      }

      const targetDate = dateData[0].date;
      setLatestDate(targetDate);

      // Build query with filters
      let query = supabase
        .from('daily_market_products')
        .select('*')
        .eq('date', targetDate);

      // Apply new location filters
      const activeParams = params || filterParams;
      
      if (activeParams.provinceId) {
        query = query.eq('province_id', activeParams.provinceId);
      }
      
      if (activeParams.districtId) {
        query = query.eq('district_id_fk', activeParams.districtId);
      }
      
      if (activeParams.localLevelId) {
        query = query.eq('local_level_id', activeParams.localLevelId);
      }
      
      if (activeParams.wardNumber) {
        query = query.eq('ward_number', activeParams.wardNumber);
      }
      
      if (activeParams.cropId) {
        query = query.eq('crop_id', activeParams.cropId);
      }

      // Legacy filters (if no new filters, use old ones)
      if (!activeParams.districtId && selectedDistrict !== 'all') {
        query = query.eq('district', selectedDistrict);
      }

      if (!activeParams.cropId && selectedCrop !== 'all') {
        query = query.eq('crop_name', selectedCrop);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Sort the data
      let sortedData = [...(data || [])];
      if (sortBy === 'name') {
        sortedData.sort((a, b) => (a.crop_name_ne || a.crop_name).localeCompare(b.crop_name_ne || b.crop_name));
      } else if (sortBy === 'price-low') {
        sortedData.sort((a, b) => (a.price_avg || 0) - (b.price_avg || 0));
      } else if (sortBy === 'price-high') {
        sortedData.sort((a, b) => (b.price_avg || 0) - (a.price_avg || 0));
      }

      setProducts(sortedData as DailyMarketProduct[]);

      // Fetch distinct districts and crops for legacy filters
      const { data: allData } = await supabase
        .from('daily_market_products')
        .select('district, crop_name')
        .eq('date', targetDate);

      if (allData) {
        const uniqueDistricts = [...new Set(allData.map(d => d.district).filter(Boolean))] as string[];
        const uniqueCrops = [...new Set(allData.map(d => d.crop_name).filter(Boolean))] as string[];
        setDistricts(uniqueDistricts);
        setCrops(uniqueCrops);
      }
    } catch (err) {
      console.error('Error fetching daily market products:', err);
      setError('बजार मूल्य लोड गर्न सकिएन।');
    } finally {
      setIsLoading(false);
    }
  }, [filterParams, selectedDistrict, selectedCrop, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update filter params and refetch
  const updateFilters = useCallback((params: FilterParams) => {
    setFilterParams(params);
    fetchProducts(params);
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    latestDate,
    // Legacy
    districts,
    crops,
    selectedDistrict,
    setSelectedDistrict,
    selectedCrop,
    setSelectedCrop,
    sortBy,
    setSortBy,
    // New
    filterParams,
    updateFilters,
    refresh: () => fetchProducts(filterParams),
  };
}
