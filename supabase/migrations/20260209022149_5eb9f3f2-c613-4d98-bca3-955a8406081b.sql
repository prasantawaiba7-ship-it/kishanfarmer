
-- =============================================
-- Phase 1: India Location Model + Crop Hindi
-- =============================================

-- 1. India States
CREATE TABLE public.india_states (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  state_code TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.india_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active states" ON public.india_states
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage states" ON public.india_states
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 2. India Districts
CREATE TABLE public.india_districts (
  id SERIAL PRIMARY KEY,
  state_id INTEGER NOT NULL REFERENCES public.india_states(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  lgd_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.india_districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active districts" ON public.india_districts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage districts" ON public.india_districts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_india_districts_state ON public.india_districts(state_id);

-- 3. India Mandis
CREATE TABLE public.india_mandis (
  id SERIAL PRIMARY KEY,
  district_id INTEGER NOT NULL REFERENCES public.india_districts(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  mandi_code TEXT,
  lat NUMERIC,
  lng NUMERIC,
  source TEXT DEFAULT 'agmarknet',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.india_mandis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active mandis" ON public.india_mandis
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage mandis" ON public.india_mandis
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_india_mandis_district ON public.india_mandis(district_id);

-- 4. Daily Mandi Prices
CREATE TABLE public.daily_mandi_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mandi_id INTEGER REFERENCES public.india_mandis(id) ON DELETE SET NULL,
  crop_id INTEGER REFERENCES public.crops(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'quintal',
  price_min NUMERIC,
  price_max NUMERIC,
  price_modal NUMERIC,
  arrival_qty NUMERIC,
  source TEXT DEFAULT 'data_gov_in',
  source_ref TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_mandi_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mandi prices" ON public.daily_mandi_prices
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage mandi prices" ON public.daily_mandi_prices
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert mandi prices" ON public.daily_mandi_prices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update mandi prices" ON public.daily_mandi_prices
  FOR UPDATE USING (true);

CREATE INDEX idx_daily_mandi_prices_date ON public.daily_mandi_prices(date);
CREATE INDEX idx_daily_mandi_prices_mandi ON public.daily_mandi_prices(mandi_id);
CREATE INDEX idx_daily_mandi_prices_crop ON public.daily_mandi_prices(crop_id);

-- 5. Add name_hi to crops table
ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS name_hi TEXT;

-- 6. Add country to farmer_profiles
ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'india';

-- Trigger for updated_at on daily_mandi_prices
CREATE TRIGGER update_daily_mandi_prices_updated_at
  BEFORE UPDATE ON public.daily_mandi_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
