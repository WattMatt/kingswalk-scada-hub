
-- Sensor readings time-series table
CREATE TABLE public.sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  kw numeric NOT NULL DEFAULT 0,
  voltage numeric NOT NULL DEFAULT 0,
  current numeric NOT NULL DEFAULT 0,
  power_factor numeric NOT NULL DEFAULT 0,
  frequency numeric NOT NULL DEFAULT 50,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast queries by equipment + time
CREATE INDEX idx_sensor_readings_equipment_time ON public.sensor_readings(equipment_id, recorded_at DESC);

-- RLS
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sensor readings are publicly readable"
  ON public.sensor_readings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Sensor readings are publicly insertable"
  ON public.sensor_readings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Sensor readings are publicly deletable"
  ON public.sensor_readings FOR DELETE
  TO anon, authenticated
  USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
