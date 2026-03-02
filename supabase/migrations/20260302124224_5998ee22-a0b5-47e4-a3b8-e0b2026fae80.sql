
-- Add bilingual columns to expert_templates
ALTER TABLE public.expert_templates
  ADD COLUMN IF NOT EXISTS title_ne text,
  ADD COLUMN IF NOT EXISTS body_ne text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS body_en text;

-- Migrate existing data: move title/body into title_ne/body_ne based on language
UPDATE public.expert_templates
SET title_ne = title, body_ne = body
WHERE language = 'ne' AND title_ne IS NULL;

UPDATE public.expert_templates
SET title_en = title, body_en = body
WHERE language = 'en' AND title_en IS NULL;

-- For Hindi or other, default to ne
UPDATE public.expert_templates
SET title_ne = title, body_ne = body
WHERE title_ne IS NULL AND title_en IS NULL;
