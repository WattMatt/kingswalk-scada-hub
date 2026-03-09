
-- Equipment type enum
CREATE TYPE public.equipment_type AS ENUM (
  'generator', 'transformer', 'inverter', 'switchgear', 'breaker', 'bus',
  'panel', 'meter', 'vfd', 'motor'
);

-- Equipment status enum
CREATE TYPE public.equipment_status AS ENUM (
  'online', 'offline', 'standby', 'warning', 'fault', 'maintenance'
);

-- Main equipment registry
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type equipment_type NOT NULL,
  status equipment_status NOT NULL DEFAULT 'offline',
  rating NUMERIC,
  rating_unit TEXT DEFAULT 'kW',
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  installation_date DATE,
  location TEXT,
  protection_settings TEXT,
  notes TEXT,
  -- Floor plan marker position (percentage-based)
  marker_left NUMERIC,
  marker_top NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Equipment connections (flat, any-to-any)
CREATE TABLE public.equipment_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  to_equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  connection_type TEXT DEFAULT 'electrical',
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT no_self_connection CHECK (from_equipment_id != to_equipment_id),
  CONSTRAINT unique_connection UNIQUE (from_equipment_id, to_equipment_id)
);

-- Enable RLS
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_connections ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for SCADA internal system)
CREATE POLICY "Equipment is publicly readable" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Equipment is publicly insertable" ON public.equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Equipment is publicly updatable" ON public.equipment FOR UPDATE USING (true);
CREATE POLICY "Equipment is publicly deletable" ON public.equipment FOR DELETE USING (true);

CREATE POLICY "Connections are publicly readable" ON public.equipment_connections FOR SELECT USING (true);
CREATE POLICY "Connections are publicly insertable" ON public.equipment_connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Connections are publicly updatable" ON public.equipment_connections FOR UPDATE USING (true);
CREATE POLICY "Connections are publicly deletable" ON public.equipment_connections FOR DELETE USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
