
-- Drop and recreate equipment policies as PERMISSIVE
DROP POLICY IF EXISTS "Equipment is publicly readable" ON public.equipment;
DROP POLICY IF EXISTS "Equipment is publicly insertable" ON public.equipment;
DROP POLICY IF EXISTS "Equipment is publicly updatable" ON public.equipment;
DROP POLICY IF EXISTS "Equipment is publicly deletable" ON public.equipment;

CREATE POLICY "Equipment is publicly readable" ON public.equipment FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Equipment is publicly insertable" ON public.equipment FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Equipment is publicly updatable" ON public.equipment FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Equipment is publicly deletable" ON public.equipment FOR DELETE TO anon, authenticated USING (true);

-- Drop and recreate equipment_connections policies
DROP POLICY IF EXISTS "Connections are publicly readable" ON public.equipment_connections;
DROP POLICY IF EXISTS "Connections are publicly insertable" ON public.equipment_connections;
DROP POLICY IF EXISTS "Connections are publicly updatable" ON public.equipment_connections;
DROP POLICY IF EXISTS "Connections are publicly deletable" ON public.equipment_connections;

CREATE POLICY "Connections are publicly readable" ON public.equipment_connections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Connections are publicly insertable" ON public.equipment_connections FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Connections are publicly updatable" ON public.equipment_connections FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Connections are publicly deletable" ON public.equipment_connections FOR DELETE TO anon, authenticated USING (true);

-- Drop and recreate equipment_documents policies
DROP POLICY IF EXISTS "Documents are publicly readable" ON public.equipment_documents;
DROP POLICY IF EXISTS "Documents are publicly insertable" ON public.equipment_documents;
DROP POLICY IF EXISTS "Documents are publicly updatable" ON public.equipment_documents;
DROP POLICY IF EXISTS "Documents are publicly deletable" ON public.equipment_documents;

CREATE POLICY "Documents are publicly readable" ON public.equipment_documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Documents are publicly insertable" ON public.equipment_documents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Documents are publicly updatable" ON public.equipment_documents FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Documents are publicly deletable" ON public.equipment_documents FOR DELETE TO anon, authenticated USING (true);
