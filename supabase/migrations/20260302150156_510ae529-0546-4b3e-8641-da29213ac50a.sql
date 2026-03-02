
-- Create expert_message_attachments table for audio & video
CREATE TABLE public.expert_message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.expert_ticket_messages(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('farmer', 'technician')),
  type text NOT NULL CHECK (type IN ('audio', 'video')),
  file_url text NOT NULL,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by message
CREATE INDEX idx_ema_message_id ON public.expert_message_attachments(message_id);
CREATE INDEX idx_ema_ticket_id ON public.expert_message_attachments(ticket_id);

-- Enable RLS
ALTER TABLE public.expert_message_attachments ENABLE ROW LEVEL SECURITY;

-- Farmers can view attachments for their tickets
CREATE POLICY "Farmers can view own ticket attachments"
  ON public.expert_message_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expert_tickets et
      WHERE et.id = ticket_id AND et.farmer_id = auth.uid()
    )
  );

-- Technicians can view attachments for their assigned tickets
CREATE POLICY "Technicians can view assigned ticket attachments"
  ON public.expert_message_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expert_tickets et
      JOIN technicians t ON t.id = et.technician_id
      WHERE et.id = ticket_id AND t.user_id = auth.uid()
    )
  );

-- Farmers can insert attachments for their tickets
CREATE POLICY "Farmers can insert own ticket attachments"
  ON public.expert_message_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM expert_tickets et
      WHERE et.id = ticket_id AND et.farmer_id = auth.uid()
    )
  );

-- Technicians can insert attachments for assigned tickets
CREATE POLICY "Technicians can insert assigned ticket attachments"
  ON public.expert_message_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM expert_tickets et
      JOIN technicians t ON t.id = et.technician_id
      WHERE et.id = ticket_id AND t.user_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "Admin full access to message attachments"
  ON public.expert_message_attachments
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create ticket-media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-media', 'ticket-media', true);

-- Storage RLS: anyone authenticated can upload to ticket-media
CREATE POLICY "Authenticated users can upload ticket media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ticket-media');

-- Anyone can read ticket-media (public bucket)
CREATE POLICY "Public read ticket media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'ticket-media');
