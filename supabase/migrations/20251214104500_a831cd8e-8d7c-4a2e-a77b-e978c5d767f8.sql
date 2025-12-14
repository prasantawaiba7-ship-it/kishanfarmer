-- Create soil data table for storing soil analysis
CREATE TABLE public.soil_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID REFERENCES public.plots(id) ON DELETE CASCADE NOT NULL,
  ph_level DECIMAL(4, 2) CHECK (ph_level >= 0 AND ph_level <= 14),
  moisture_percentage DECIMAL(5, 2) CHECK (moisture_percentage >= 0 AND moisture_percentage <= 100),
  nitrogen_level DECIMAL(6, 2),
  phosphorus_level DECIMAL(6, 2),
  potassium_level DECIMAL(6, 2),
  organic_carbon DECIMAL(5, 2),
  soil_type TEXT,
  data_source TEXT DEFAULT 'soilgrids',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.soil_data ENABLE ROW LEVEL SECURITY;

-- Create weather data table
CREATE TABLE public.weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID REFERENCES public.plots(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  rainfall_mm DECIMAL(8, 2),
  wind_speed DECIMAL(6, 2),
  forecast_date DATE NOT NULL,
  data_source TEXT DEFAULT 'openmeteo',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

-- Create crop recommendations table
CREATE TABLE public.crop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID REFERENCES public.plots(id) ON DELETE CASCADE NOT NULL,
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE CASCADE NOT NULL,
  recommended_crops JSONB NOT NULL,
  yield_forecast JSONB,
  profit_margins JSONB,
  sustainability_score DECIMAL(3, 2) CHECK (sustainability_score >= 0 AND sustainability_score <= 1),
  soil_health_score DECIMAL(3, 2) CHECK (soil_health_score >= 0 AND soil_health_score <= 1),
  input_recommendations JSONB,
  reasoning TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crop_recommendations ENABLE ROW LEVEL SECURITY;

-- Create market prices table
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type crop_type NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  mandi_name TEXT,
  price_per_quintal DECIMAL(10, 2),
  price_date DATE NOT NULL,
  demand_level TEXT CHECK (demand_level IN ('low', 'medium', 'high')),
  data_source TEXT DEFAULT 'agmarknet',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

-- Create AI chat history table
CREATE TABLE public.ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image')),
  image_url TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Create disease detections table
CREATE TABLE public.disease_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmer_profiles(id) ON DELETE CASCADE NOT NULL,
  plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  detected_disease TEXT,
  confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  treatment_recommendations JSONB,
  prevention_tips TEXT[],
  language TEXT DEFAULT 'en',
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.disease_detections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for soil_data
CREATE POLICY "Farmers can view their soil data"
  ON public.soil_data FOR SELECT
  USING (plot_id IN (
    SELECT p.id FROM public.plots p
    JOIN public.farmer_profiles fp ON p.farmer_id = fp.id
    WHERE fp.user_id = auth.uid()
  ));

CREATE POLICY "Authorities can view all soil data"
  ON public.soil_data FOR SELECT
  USING (public.has_role(auth.uid(), 'authority') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert soil data"
  ON public.soil_data FOR INSERT
  WITH CHECK (true);

-- RLS Policies for weather_data
CREATE POLICY "Anyone can view weather data"
  ON public.weather_data FOR SELECT
  USING (true);

CREATE POLICY "System can insert weather data"
  ON public.weather_data FOR INSERT
  WITH CHECK (true);

-- RLS Policies for crop_recommendations
CREATE POLICY "Farmers can view their recommendations"
  ON public.crop_recommendations FOR SELECT
  USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authorities can view all recommendations"
  ON public.crop_recommendations FOR SELECT
  USING (public.has_role(auth.uid(), 'authority') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert recommendations"
  ON public.crop_recommendations FOR INSERT
  WITH CHECK (true);

-- RLS Policies for market_prices (public data)
CREATE POLICY "Anyone can view market prices"
  ON public.market_prices FOR SELECT
  USING (true);

CREATE POLICY "System can insert market prices"
  ON public.market_prices FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ai_chat_history
CREATE POLICY "Farmers can view their chat history"
  ON public.ai_chat_history FOR SELECT
  USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Farmers can insert their chat messages"
  ON public.ai_chat_history FOR INSERT
  WITH CHECK (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert chat messages"
  ON public.ai_chat_history FOR INSERT
  WITH CHECK (true);

-- RLS Policies for disease_detections
CREATE POLICY "Farmers can view their disease detections"
  ON public.disease_detections FOR SELECT
  USING (farmer_id IN (SELECT id FROM public.farmer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert disease detections"
  ON public.disease_detections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authorities can view all disease detections"
  ON public.disease_detections FOR SELECT
  USING (public.has_role(auth.uid(), 'authority') OR public.has_role(auth.uid(), 'admin'));