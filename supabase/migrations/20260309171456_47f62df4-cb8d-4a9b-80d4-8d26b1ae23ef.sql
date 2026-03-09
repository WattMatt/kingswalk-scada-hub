
-- Document category enum
CREATE TYPE public.document_category AS ENUM (
  'coc',
  'lease_agreement',
  'contact_details',
  'utility_account',
  'compliance_register',
  'lighting_schedule',
  'maintenance_report',
  'specification',
  'other'
);

-- Equipment documents table
CREATE TABLE public.equipment_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  category document_category NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_documents ENABLE ROW LEVEL SECURITY;

-- Public access policies (internal SCADA system)
CREATE POLICY "Documents are publicly readable" ON public.equipment_documents FOR SELECT USING (true);
CREATE POLICY "Documents are publicly insertable" ON public.equipment_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Documents are publicly updatable" ON public.equipment_documents FOR UPDATE USING (true);
CREATE POLICY "Documents are publicly deletable" ON public.equipment_documents FOR DELETE USING (true);

-- Updated_at trigger
CREATE TRIGGER update_equipment_documents_updated_at
  BEFORE UPDATE ON public.equipment_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for equipment documents
INSERT INTO storage.buckets (id, name, public) VALUES ('equipment-documents', 'equipment-documents', true);

-- Storage policies
CREATE POLICY "Equipment docs are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'equipment-documents');
CREATE POLICY "Equipment docs are publicly uploadable" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'equipment-documents');
CREATE POLICY "Equipment docs are publicly deletable" ON storage.objects FOR DELETE USING (bucket_id = 'equipment-documents');
