-- Create image source enum
CREATE TYPE public.crop_image_source AS ENUM ('ai', 'admin_upload', 'external', 'none');

-- Add new photo management columns to crops table
ALTER TABLE public.crops 
ADD COLUMN IF NOT EXISTS image_url_ai_suggested text,
ADD COLUMN IF NOT EXISTS image_url_uploaded text,
ADD COLUMN IF NOT EXISTS image_source public.crop_image_source DEFAULT 'none',
ADD COLUMN IF NOT EXISTS needs_image_review boolean DEFAULT true;

-- Migrate existing image_url data to image_url as the main image
-- (image_url already exists and serves as image_url_main)
-- Set image_source to 'external' for crops that already have an image_url
UPDATE public.crops 
SET image_source = 'external', needs_image_review = false 
WHERE image_url IS NOT NULL AND image_url != '';

-- Create storage bucket for crop photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('crop-images', 'crop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for crop-images bucket
CREATE POLICY "Anyone can view crop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'crop-images');

CREATE POLICY "Admins can upload crop images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'crop-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update crop images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'crop-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete crop images"
ON storage.objects FOR DELETE
USING (bucket_id = 'crop-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));