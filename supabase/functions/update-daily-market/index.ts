import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Product images mapping
const PRODUCT_IMAGES: Record<string, string> = {
  'Tomato': 'https://images.unsplash.com/photo-1546470427-227c7369a9b0?w=400',
  'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82ber40a?w=400',
  'Onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400',
  'Cabbage': 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400',
  'Cauliflower': 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400',
  'Carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
  'Green Beans': 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=400',
  'Cucumber': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400',
  'Spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
  'Radish': 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400',
  'Chili': 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400',
  'Garlic': 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400',
  'Ginger': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Brinjal': 'https://images.unsplash.com/photo-1635909096289-7fdc0d87df6f?w=400',
  'Bitter Gourd': 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400',
};

// Generate random price variation
function randomVariation(basePrice: number, variationPercent: number = 20): { min: number; max: number; avg: number } {
  const variation = basePrice * (variationPercent / 100);
  const min = Math.round(basePrice - variation + (Math.random() * variation * 0.5));
  const max = Math.round(basePrice + variation - (Math.random() * variation * 0.5));
  const avg = Math.round((min + max) / 2);
  return { min, max, avg };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`[update-daily-market] Starting daily market update for ${today}`);
    
    // Fetch crops from the crops master table
    const { data: crops, error: cropsError } = await supabase
      .from('crops')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (cropsError) {
      console.error('[update-daily-market] Error fetching crops:', cropsError);
      throw cropsError;
    }
    
    if (!crops || crops.length === 0) {
      console.log('[update-daily-market] No active crops found');
      return new Response(
        JSON.stringify({ success: false, error: 'No active crops found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch districts with local levels for market locations
    const { data: districts, error: districtsError } = await supabase
      .from('districts')
      .select(`
        id,
        name_ne,
        name_en,
        province_id,
        provinces (id, name_ne, name_en)
      `)
      .order('display_order')
      .limit(10);
    
    if (districtsError) {
      console.error('[update-daily-market] Error fetching districts:', districtsError);
    }
    
    // Base prices for different crop categories
    const basePrices: Record<string, number> = {
      'Tomato': 100,
      'Potato': 50,
      'Onion': 75,
      'Cabbage': 40,
      'Cauliflower': 55,
      'Carrot': 65,
      'Green Beans': 80,
      'Cucumber': 55,
      'Spinach': 30,
      'Radish': 40,
      'Chili': 125,
      'Garlic': 250,
      'Ginger': 180,
      'Brinjal': 60,
      'Bitter Gourd': 70,
      'Pumpkin': 35,
      'Bottle Gourd': 40,
      'Okra': 90,
      'Coriander': 25,
      'Mustard Greens': 20,
      'Rice': 85,
      'Wheat': 45,
      'Maize': 35,
      'Apple': 200,
      'Mango': 150,
      'Banana': 80,
      'Orange': 120,
      'Lemon': 100,
    };
    
    // Generate products for each district and crop
    const productsToUpsert = [];
    
    const targetDistricts = districts || [
      { id: null, name_ne: 'काठमाण्डौ', name_en: 'Kathmandu', province_id: 3 },
    ];
    
    for (const district of targetDistricts) {
      for (const crop of crops) {
        const basePrice = basePrices[crop.name_en] || 50;
        const prices = randomVariation(basePrice);
        
        productsToUpsert.push({
          date: today,
          crop_name: crop.name_en,
          crop_name_ne: crop.name_ne,
          image_url: crop.image_url || PRODUCT_IMAGES[crop.name_en] || null,
          unit: crop.unit || 'kg',
          price_min: prices.min,
          price_max: prices.max,
          price_avg: prices.avg,
          market_name: district.name_en || 'General Market',
          market_name_ne: district.name_ne || 'सामान्य बजार',
          district: district.name_en || 'Kathmandu',
          source: 'auto_update',
          // New location fields
          province_id: district.province_id || null,
          district_id_fk: district.id || null,
          crop_id: crop.id,
        });
      }
    }
    
    console.log(`[update-daily-market] Upserting ${productsToUpsert.length} products`);
    
    // Upsert products (update if exists, insert if not)
    const { data, error } = await supabase
      .from('daily_market_products')
      .upsert(productsToUpsert, {
        onConflict: 'date,crop_name,market_name',
        ignoreDuplicates: false,
      });
    
    if (error) {
      console.error('[update-daily-market] Error upserting products:', error);
      throw error;
    }
    
    console.log(`[update-daily-market] Successfully updated daily market products for ${today}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${productsToUpsert.length} products for ${today}`,
        date: today,
        productsCount: productsToUpsert.length,
        cropsUsed: crops.length,
        districtsUsed: targetDistricts.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update daily market products';
    console.error('[update-daily-market] Error:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
