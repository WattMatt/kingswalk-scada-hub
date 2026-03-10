CREATE TABLE public.alarm_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type text NOT NULL,
  metric text NOT NULL,
  min_value numeric,
  max_value numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (equipment_type, metric)
);

ALTER TABLE public.alarm_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thresholds are publicly readable" ON public.alarm_thresholds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Thresholds are publicly insertable" ON public.alarm_thresholds FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Thresholds are publicly updatable" ON public.alarm_thresholds FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Thresholds are publicly deletable" ON public.alarm_thresholds FOR DELETE TO anon, authenticated USING (true);