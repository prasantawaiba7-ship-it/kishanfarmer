-- Create app_settings table for feature flags and global configuration
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create content_blocks table for CMS-like content management
CREATE TABLE public.content_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  content_type text NOT NULL DEFAULT 'text',
  metadata jsonb DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create subscription_plans table for configurable plans
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_ne text,
  description text,
  description_ne text,
  plan_type text NOT NULL UNIQUE,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NPR',
  stripe_price_id text,
  stripe_product_id text,
  ai_call_limit integer,
  pdf_report_limit integer,
  features jsonb DEFAULT '[]',
  is_visible boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create pdf_reports table for tracking generated reports
CREATE TABLE public.pdf_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id uuid NOT NULL,
  plot_id uuid,
  report_type text NOT NULL DEFAULT 'crop_analysis',
  title text NOT NULL,
  crop_type text,
  detected_issue text,
  severity text,
  file_url text,
  status text NOT NULL DEFAULT 'generated',
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create email_settings table for notification configuration
CREATE TABLE public.email_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  subject_template text NOT NULL,
  body_template text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create activity_logs table for admin activity tracking
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- App Settings policies (admin only for write, read for all authenticated)
CREATE POLICY "Anyone can read app settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage app settings" ON public.app_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Content Blocks policies
CREATE POLICY "Anyone can read active content blocks" ON public.content_blocks
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage content blocks" ON public.content_blocks
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Subscription Plans policies (public read, admin write)
CREATE POLICY "Anyone can read visible subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_visible = true AND is_active = true);

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- PDF Reports policies
CREATE POLICY "Farmers can view their own reports" ON public.pdf_reports
  FOR SELECT USING (farmer_id IN (
    SELECT id FROM farmer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all reports" ON public.pdf_reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert reports" ON public.pdf_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage reports" ON public.pdf_reports
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Email Settings policies (admin only)
CREATE POLICY "Admins can manage email settings" ON public.email_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Activity Logs policies
CREATE POLICY "Admins can view activity logs" ON public.activity_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (true);

-- Foreign key for pdf_reports
ALTER TABLE public.pdf_reports
  ADD CONSTRAINT pdf_reports_farmer_id_fkey
  FOREIGN KEY (farmer_id) REFERENCES public.farmer_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.pdf_reports
  ADD CONSTRAINT pdf_reports_plot_id_fkey
  FOREIGN KEY (plot_id) REFERENCES public.plots(id) ON DELETE SET NULL;

-- Insert default app settings
INSERT INTO public.app_settings (key, value, description, category) VALUES
  ('free_ai_uses', '3', 'Default free AI uses for new users', 'limits'),
  ('max_ai_calls_per_day', '100', 'Maximum AI calls per day per user', 'limits'),
  ('voice_assistant_enabled', 'true', 'Enable/disable voice assistant feature', 'features'),
  ('pdf_report_enabled', 'true', 'Enable/disable PDF report generation', 'features'),
  ('email_notifications_enabled', 'true', 'Enable/disable email notifications', 'features'),
  ('offline_mode_enabled', 'true', 'Enable/disable offline mode', 'features'),
  ('auto_translate_enabled', 'true', 'Enable/disable auto translation', 'features'),
  ('maintenance_mode', 'false', 'Put app in maintenance mode', 'system');

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, name_ne, description, description_ne, plan_type, price, currency, stripe_price_id, stripe_product_id, ai_call_limit, pdf_report_limit, features, display_order) VALUES
  ('Free', 'निःशुल्क', 'Basic access with limited features', 'सीमित सुविधाहरूसँग आधारभूत पहुँच', 'free', 0, 'NPR', null, null, 3, 1, '["3 AI queries", "Basic crop advice", "1 PDF report"]', 0),
  ('Monthly', 'मासिक', 'Full access for 30 days', '३० दिनको लागि पूर्ण पहुँच', 'monthly', 99, 'NPR', 'price_1Sq7E4K6BJzWBeP74jI2gpkN', 'prod_TnifXyUztVMKgt', null, null, '["Unlimited AI queries", "Disease detection", "Unlimited PDF reports", "Priority support"]', 1),
  ('Yearly', 'वार्षिक', 'Full access for 365 days - Best value!', '३६५ दिनको लागि पूर्ण पहुँच - सबैभन्दा राम्रो मूल्य!', 'yearly', 999, 'NPR', 'price_1Sq7F8K6BJzWBeP7edqzEwof', 'prod_TnigdkIT7X4QzJ', null, null, '["Unlimited AI queries", "Disease detection", "Unlimited PDF reports", "Priority support", "2 months free"]', 2);

-- Insert default email settings
INSERT INTO public.email_settings (event_type, enabled, subject_template, body_template) VALUES
  ('welcome', true, 'Welcome to KrishiMitra!', 'Dear {{name}}, welcome to KrishiMitra. Start your farming journey with AI assistance.'),
  ('subscription_activated', true, 'Subscription Activated - KrishiMitra', 'Dear {{name}}, your {{plan}} subscription is now active until {{end_date}}.'),
  ('subscription_expired', true, 'Subscription Expired - KrishiMitra', 'Dear {{name}}, your subscription has expired. Renew to continue using premium features.'),
  ('subscription_cancelled', true, 'Subscription Cancelled - KrishiMitra', 'Dear {{name}}, your subscription has been cancelled. You can resubscribe anytime.');

-- Insert default content blocks
INSERT INTO public.content_blocks (key, title, content, language, content_type) VALUES
  ('welcome_message_en', 'Welcome Message', 'Welcome to KrishiMitra - Your AI farming assistant!', 'en', 'text'),
  ('welcome_message_ne', 'स्वागत सन्देश', 'कृषि मित्रमा स्वागत छ - तपाईंको AI कृषि सहायक!', 'ne', 'text'),
  ('upgrade_banner_en', 'Upgrade Banner', 'Upgrade to Premium for unlimited AI queries and more!', 'en', 'text'),
  ('upgrade_banner_ne', 'अपग्रेड ब्यानर', 'असीमित AI प्रश्नहरू र थप सुविधाहरूको लागि प्रिमियममा अपग्रेड गर्नुहोस्!', 'ne', 'text'),
  ('ai_system_prompt', 'AI System Prompt', 'You are KrishiMitra, an AI agricultural assistant for Nepali farmers. Respond in a helpful, practical manner focusing on local farming practices.', 'en', 'prompt');

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_content_blocks_updated_at
  BEFORE UPDATE ON public.content_blocks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();