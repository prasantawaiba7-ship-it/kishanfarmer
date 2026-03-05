
-- Add triage, resolution, and workflow fields to expert_tickets
ALTER TABLE public.expert_tickets
  ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS first_response_source text CHECK (first_response_source IN ('bot', 'expert', null)),
  ADD COLUMN IF NOT EXISTS needs_expert_review boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalation_reason text,
  ADD COLUMN IF NOT EXISTS resolution_status text CHECK (resolution_status IN ('pending', 'resolved', 'unresolved', 'followup_needed', null)),
  ADD COLUMN IF NOT EXISTS satisfaction_score integer CHECK (satisfaction_score IS NULL OR (satisfaction_score >= 1 AND satisfaction_score <= 5)),
  ADD COLUMN IF NOT EXISTS farmer_feedback text,
  ADD COLUMN IF NOT EXISTS feedback_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz,
  ADD COLUMN IF NOT EXISTS handled_by text CHECK (handled_by IN ('bot', 'expert', 'bot_then_expert', null)),
  ADD COLUMN IF NOT EXISTS triage_tags text[] DEFAULT '{}';

-- Ticket events/history table for state transition logging
CREATE TABLE public.ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.expert_tickets(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'created', 'bot_answered', 'escalated_to_expert', 'expert_assigned',
    'expert_opened', 'expert_answered', 'farmer_replied', 'info_requested',
    'reassigned', 'closed', 'reopened', 'feedback_received', 'status_changed'
  )),
  from_status text,
  to_status text,
  actor_id text,
  actor_type text CHECK (actor_type IN ('system', 'farmer', 'expert', 'admin', null)),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for ticket_events
ALTER TABLE public.ticket_events ENABLE ROW LEVEL SECURITY;

-- Farmers can see events for their own tickets
CREATE POLICY "Farmers can view their ticket events"
  ON public.ticket_events FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.expert_tickets WHERE farmer_id = auth.uid()
    )
  );

-- Technicians can view events for assigned tickets
CREATE POLICY "Technicians can view assigned ticket events"
  ON public.ticket_events FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT et.id FROM public.expert_tickets et
      JOIN public.technicians t ON et.technician_id = t.id
      WHERE t.user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage ticket events"
  ON public.ticket_events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- System/authenticated users can insert events (for logging)
CREATE POLICY "Authenticated users can log ticket events"
  ON public.ticket_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_ticket_events_ticket_id ON public.ticket_events(ticket_id);
CREATE INDEX idx_expert_tickets_risk_level ON public.expert_tickets(risk_level);
CREATE INDEX idx_expert_tickets_needs_review ON public.expert_tickets(needs_expert_review) WHERE needs_expert_review = true;

-- Function to log ticket state transitions automatically
CREATE OR REPLACE FUNCTION public.log_ticket_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.ticket_events (ticket_id, event_type, from_status, to_status, actor_type)
    VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, 'system');
  END IF;
  
  -- Track first response time
  IF OLD.status = 'open' AND NEW.status IN ('in_progress', 'answered') AND NEW.first_response_at IS NULL THEN
    NEW.first_response_at = now();
  END IF;
  
  -- Track close time
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_ticket_status
  BEFORE UPDATE ON public.expert_tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_ticket_status_change();
