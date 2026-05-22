
-- Migrate legacy 'executive' role to 'operations'
UPDATE public.user_roles SET role = 'operations' WHERE role = 'executive';

-- Recreate CRM insert/update policies to include 'operations' alongside admin/analyst
-- (viewer is read-only; admin retains delete)

-- leads
DROP POLICY IF EXISTS "crm insert" ON public.leads;
DROP POLICY IF EXISTS "crm update" ON public.leads;
CREATE POLICY "crm insert" ON public.leads FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );
CREATE POLICY "crm update" ON public.leads FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );

-- clients
DROP POLICY IF EXISTS "crm insert" ON public.clients;
DROP POLICY IF EXISTS "crm update" ON public.clients;
CREATE POLICY "crm insert" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );
CREATE POLICY "crm update" ON public.clients FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );

-- deals
DROP POLICY IF EXISTS "crm insert" ON public.deals;
DROP POLICY IF EXISTS "crm update" ON public.deals;
CREATE POLICY "crm insert" ON public.deals FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );
CREATE POLICY "crm update" ON public.deals FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );

-- quotes
DROP POLICY IF EXISTS "crm insert" ON public.quotes;
DROP POLICY IF EXISTS "crm update" ON public.quotes;
CREATE POLICY "crm insert" ON public.quotes FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );
CREATE POLICY "crm update" ON public.quotes FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );

-- activities
DROP POLICY IF EXISTS "crm insert" ON public.activities;
DROP POLICY IF EXISTS "crm update" ON public.activities;
CREATE POLICY "crm insert" ON public.activities FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );
CREATE POLICY "crm update" ON public.activities FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );

-- appointments
DROP POLICY IF EXISTS "crm insert" ON public.appointments;
DROP POLICY IF EXISTS "crm update" ON public.appointments;
CREATE POLICY "crm insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );
CREATE POLICY "crm update" ON public.appointments FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'analyst')
    OR public.has_role(auth.uid(), 'operations')
  );
