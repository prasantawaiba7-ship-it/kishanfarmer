-- Create crop_treatments table for admin-managed treatment methods
CREATE TABLE public.crop_treatments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name TEXT NOT NULL,
  disease_or_pest_name TEXT NOT NULL,
  disease_or_pest_name_ne TEXT,
  treatment_title TEXT NOT NULL,
  treatment_title_ne TEXT,
  treatment_steps JSONB NOT NULL DEFAULT '[]',
  treatment_steps_ne JSONB DEFAULT '[]',
  chemical_treatment TEXT,
  chemical_treatment_ne TEXT,
  organic_treatment TEXT,
  organic_treatment_ne TEXT,
  youtube_video_url TEXT,
  video_thumbnail_url TEXT,
  images JSONB DEFAULT '[]',
  severity_level TEXT DEFAULT 'medium',
  estimated_recovery_days INTEGER,
  cost_estimate TEXT,
  best_season TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crop_treatments ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active treatments
CREATE POLICY "Anyone can view active treatments"
  ON public.crop_treatments
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage treatments
CREATE POLICY "Admins can manage treatments"
  ON public.crop_treatments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_crop_treatments_crop_disease ON public.crop_treatments(crop_name, disease_or_pest_name);
CREATE INDEX idx_crop_treatments_active ON public.crop_treatments(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_crop_treatments_updated_at
  BEFORE UPDATE ON public.crop_treatments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();