import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Province {
  id: number;
  name_ne: string;
  name_en: string;
  display_order: number;
}

export interface District {
  id: number;
  province_id: number;
  name_ne: string;
  name_en: string;
  display_order: number;
}

export interface LocalLevel {
  id: number;
  district_id: number;
  name_ne: string;
  name_en: string;
  type: 'metropolitan' | 'sub_metropolitan' | 'municipality' | 'rural_municipality';
  total_wards: number;
  display_order: number;
}

export interface Ward {
  id: number;
  local_level_id: number;
  ward_number: number;
}

export function useLocationData() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [localLevels, setLocalLevels] = useState<LocalLevel[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected filters
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedLocalLevelId, setSelectedLocalLevelId] = useState<number | null>(null);
  const [selectedWardNumber, setSelectedWardNumber] = useState<number | null>(null);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('provinces')
          .select('*')
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;
        setProvinces((data || []) as Province[]);
      } catch (err) {
        console.error('Error fetching provinces:', err);
        setError('प्रदेश लोड गर्न सकिएन।');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  const fetchDistricts = useCallback(async (provinceId: number | null) => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('districts')
        .select('*')
        .eq('province_id', provinceId)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      setDistricts((data || []) as District[]);
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  }, []);

  // Fetch local levels when district changes
  const fetchLocalLevels = useCallback(async (districtId: number | null) => {
    if (!districtId) {
      setLocalLevels([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('local_levels')
        .select('*')
        .eq('district_id', districtId)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      setLocalLevels((data || []) as LocalLevel[]);
    } catch (err) {
      console.error('Error fetching local levels:', err);
    }
  }, []);

  // Fetch wards when local level changes
  const fetchWards = useCallback(async (localLevelId: number | null) => {
    if (!localLevelId) {
      setWards([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('wards')
        .select('*')
        .eq('local_level_id', localLevelId)
        .order('ward_number', { ascending: true });

      if (fetchError) throw fetchError;
      setWards((data || []) as Ward[]);
    } catch (err) {
      console.error('Error fetching wards:', err);
    }
  }, []);

  // Handle province selection
  const handleProvinceChange = useCallback((provinceId: number | null) => {
    setSelectedProvinceId(provinceId);
    setSelectedDistrictId(null);
    setSelectedLocalLevelId(null);
    setSelectedWardNumber(null);
    setLocalLevels([]);
    setWards([]);
    fetchDistricts(provinceId);
  }, [fetchDistricts]);

  // Handle district selection
  const handleDistrictChange = useCallback((districtId: number | null) => {
    setSelectedDistrictId(districtId);
    setSelectedLocalLevelId(null);
    setSelectedWardNumber(null);
    setWards([]);
    fetchLocalLevels(districtId);
  }, [fetchLocalLevels]);

  // Handle local level selection
  const handleLocalLevelChange = useCallback((localLevelId: number | null) => {
    setSelectedLocalLevelId(localLevelId);
    setSelectedWardNumber(null);
    fetchWards(localLevelId);
  }, [fetchWards]);

  // Handle ward selection
  const handleWardChange = useCallback((wardNumber: number | null) => {
    setSelectedWardNumber(wardNumber);
  }, []);

  // Get ward numbers from selected local level
  const wardNumbers = localLevels.find(ll => ll.id === selectedLocalLevelId)?.total_wards || 0;
  const availableWards = Array.from({ length: wardNumbers }, (_, i) => i + 1);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSelectedProvinceId(null);
    setSelectedDistrictId(null);
    setSelectedLocalLevelId(null);
    setSelectedWardNumber(null);
    setDistricts([]);
    setLocalLevels([]);
    setWards([]);
  }, []);

  return {
    // Data
    provinces,
    districts,
    localLevels,
    wards,
    availableWards,

    // Selected values
    selectedProvinceId,
    selectedDistrictId,
    selectedLocalLevelId,
    selectedWardNumber,

    // Handlers
    handleProvinceChange,
    handleDistrictChange,
    handleLocalLevelChange,
    handleWardChange,
    resetFilters,

    // State
    isLoading,
    error,
  };
}

// Separate hook for fetching all districts
export function useAllDistricts() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllDistricts = async () => {
      try {
        const { data, error } = await supabase
          .from('districts')
          .select('*')
          .order('name_ne', { ascending: true });

        if (error) throw error;
        setDistricts((data || []) as District[]);
      } catch (err) {
        console.error('Error fetching all districts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDistricts();
  }, []);

  return { districts, isLoading };
}
