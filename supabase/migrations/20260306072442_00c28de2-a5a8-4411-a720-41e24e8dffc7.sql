
-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload voice notes
CREATE POLICY "Authenticated users can upload voice notes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-notes');

-- Allow public read access
CREATE POLICY "Public read access for voice notes"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'voice-notes');

-- Add audio fields to expert_ticket_messages
ALTER TABLE public.expert_ticket_messages
ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS audio_duration_seconds integer,
ADD COLUMN IF NOT EXISTS transcript_text text;

-- Add audio fields to ai_chat_history
ALTER TABLE public.ai_chat_history
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS audio_duration_seconds integer;
