-- =====================================================
-- KHETI GUIDE SYSTEM UPGRADE
-- =====================================================

-- 1. Add crop_id foreign key to crop_guides (link to crops table)
ALTER TABLE public.crop_guides 
  ADD COLUMN IF NOT EXISTS crop_id integer REFERENCES public.crops(id);

-- 2. Add versioning and publishing fields to crop_guides
ALTER TABLE public.crop_guides 
  ADD COLUMN IF NOT EXISTS step_number integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone DEFAULT now();

-- 3. Create guide_rules table for automatic selection
CREATE TABLE IF NOT EXISTS public.guide_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id integer NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  stage text, -- seedling, transplanting, flowering, harvest, etc.
  problem_type text, -- general, disease, pest, fertilizer, irrigation, market
  severity text, -- low, medium, high
  guide_tag text NOT NULL, -- for grouping guide sections
  priority integer DEFAULT 0, -- higher = chosen first
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Add RLS to guide_rules
ALTER TABLE public.guide_rules ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage guide_rules
CREATE POLICY "Admins can manage guide_rules" ON public.guide_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anyone to read active guide_rules
CREATE POLICY "Anyone can view active guide_rules" ON public.guide_rules
  FOR SELECT USING (is_active = true);

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guide_rules_crop_id ON public.guide_rules(crop_id);
CREATE INDEX IF NOT EXISTS idx_guide_rules_priority ON public.guide_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_crop_guides_crop_id ON public.crop_guides(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_guides_is_published ON public.crop_guides(is_published);

-- 6. Update existing crop_guides to link to crops table (match by name)
UPDATE public.crop_guides g
SET crop_id = (
  SELECT c.id FROM public.crops c 
  WHERE c.name_ne = g.crop_name OR c.name_en = g.crop_name
  LIMIT 1
)
WHERE g.crop_id IS NULL;

-- 7. Trigger for guide_rules updated_at
CREATE TRIGGER update_guide_rules_updated_at
  BEFORE UPDATE ON public.guide_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();