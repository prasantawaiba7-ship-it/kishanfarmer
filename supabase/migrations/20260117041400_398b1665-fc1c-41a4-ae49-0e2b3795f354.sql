-- Create agricultural officers directory table
CREATE TABLE public.agricultural_officers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ne TEXT,
  designation TEXT NOT NULL DEFAULT 'कृषि प्राविधिक',
  designation_ne TEXT DEFAULT 'कृषि प्राविधिक',
  phone TEXT,
  alternate_phone TEXT,
  email TEXT,
  district TEXT NOT NULL,
  province TEXT NOT NULL,
  municipality TEXT,
  ward_no INTEGER,
  office_name TEXT,
  office_name_ne TEXT,
  office_address TEXT,
  office_address_ne TEXT,
  specializations TEXT[] DEFAULT '{}',
  working_hours TEXT DEFAULT '10:00 AM - 5:00 PM',
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agricultural_officers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active agricultural officers"
ON public.agricultural_officers
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage agricultural officers"
ON public.agricultural_officers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_agricultural_officers_updated_at
BEFORE UPDATE ON public.agricultural_officers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for Nepal districts
INSERT INTO public.agricultural_officers (name, name_ne, designation, designation_ne, phone, email, district, province, municipality, office_name, office_name_ne, office_address_ne, specializations, is_available)
VALUES
  ('राम बहादुर थापा', 'राम बहादुर थापा', 'Senior Agricultural Officer', 'वरिष्ठ कृषि अधिकृत', '+977-1-4211623', 'agri.ktm@gov.np', 'Kathmandu', 'Bagmati', 'Kathmandu Metropolitan', 'जिल्ला कृषि विकास कार्यालय', 'जिल्ला कृषि विकास कार्यालय', 'हरिहरभवन, ललितपुर', ARRAY['धान', 'तरकारी', 'रोग व्यवस्थापन'], true),
  ('सीता कुमारी श्रेष्ठ', 'सीता कुमारी श्रेष्ठ', 'Agricultural Technician', 'कृषि प्राविधिक', '+977-1-5521456', 'agri.lalitpur@gov.np', 'Lalitpur', 'Bagmati', 'Lalitpur Metropolitan', 'कृषि ज्ञान केन्द्र', 'कृषि ज्ञान केन्द्र', 'पुल्चोक, ललितपुर', ARRAY['फलफूल', 'कीट नियन्त्रण'], true),
  ('हरि प्रसाद पौडेल', 'हरि प्रसाद पौडेल', 'Plant Protection Officer', 'बाली संरक्षण अधिकृत', '+977-61-520123', 'agri.kaski@gov.np', 'Kaski', 'Gandaki', 'Pokhara Metropolitan', 'जिल्ला कृषि विकास कार्यालय', 'जिल्ला कृषि विकास कार्यालय', 'पोखरा-८, कास्की', ARRAY['रोग पहिचान', 'कीट व्यवस्थापन', 'जैविक खेती'], true),
  ('कृष्ण प्रसाद आचार्य', 'कृष्ण प्रसाद आचार्य', 'Agricultural Officer', 'कृषि अधिकृत', '+977-56-520456', 'agri.chitwan@gov.np', 'Chitwan', 'Bagmati', 'Bharatpur Metropolitan', 'कृषि विकास निर्देशनालय', 'कृषि विकास निर्देशनालय', 'भरतपुर-१०, चितवन', ARRAY['धान', 'मकै', 'तरकारी'], true),
  ('गीता देवी यादव', 'गीता देवी यादव', 'Agricultural Technician', 'कृषि प्राविधिक', '+977-41-520789', 'agri.rupandehi@gov.np', 'Rupandehi', 'Lumbini', 'Butwal Sub-Metropolitan', 'कृषि सेवा केन्द्र', 'कृषि सेवा केन्द्र', 'बुटवल-११, रुपन्देही', ARRAY['गहुँ', 'मुसुरो', 'मल व्यवस्थापन'], true),
  ('बिनोद कुमार राई', 'बिनोद कुमार राई', 'Horticulture Officer', 'बागवानी अधिकृत', '+977-25-520321', 'agri.morang@gov.np', 'Morang', 'Koshi', 'Biratnagar Metropolitan', 'जिल्ला कृषि विकास कार्यालय', 'जिल्ला कृषि विकास कार्यालय', 'विराटनगर-६, मोरङ', ARRAY['फलफूल', 'सुन्तला', 'अम्बा'], true),
  ('माया गुरुङ', 'माया गुरुङ', 'Agricultural Technician', 'कृषि प्राविधिक', '+977-66-520654', 'agri.dhading@gov.np', 'Dhading', 'Bagmati', 'Dhading Besi Municipality', 'कृषि सेवा केन्द्र', 'कृषि सेवा केन्द्र', 'धादिङबेसी-१, धादिङ', ARRAY['आलु', 'तोरी', 'पहाडी खेती'], true),
  ('सूर्य बहादुर खड्का', 'सूर्य बहादुर खड्का', 'Senior Agricultural Officer', 'वरिष्ठ कृषि अधिकृत', '+977-71-520987', 'agri.dang@gov.np', 'Dang', 'Lumbini', 'Ghorahi Sub-Metropolitan', 'जिल्ला कृषि विकास कार्यालय', 'जिल्ला कृषि विकास कार्यालय', 'घोराही-१, दाङ', ARRAY['धान', 'उखु', 'मौरीपालन'], true);