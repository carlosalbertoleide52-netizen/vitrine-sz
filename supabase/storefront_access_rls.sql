-- Bloqueio real da vitrine para empresas nao ativas.
-- Mantem acesso publico somente para empresas com status "ativo"/"active"
-- e preserva o acesso autenticado para o proprio tenant e SUPER_ADMIN.

BEGIN;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "permissao_total" ON public.companies;
DROP POLICY IF EXISTS "permissao_total" ON public.products;

DROP POLICY IF EXISTS "companies_public_storefront_active_only" ON public.companies;
DROP POLICY IF EXISTS "companies_authenticated_tenant_read" ON public.companies;
DROP POLICY IF EXISTS "companies_authenticated_tenant_update" ON public.companies;
DROP POLICY IF EXISTS "companies_authenticated_create" ON public.companies;

DROP POLICY IF EXISTS "products_public_storefront_active_only" ON public.products;
DROP POLICY IF EXISTS "products_authenticated_tenant_read" ON public.products;
DROP POLICY IF EXISTS "products_authenticated_tenant_write" ON public.products;

CREATE POLICY "companies_public_storefront_active_only"
ON public.companies
FOR SELECT
TO anon, authenticated
USING (lower(coalesce(status, '')) IN ('ativo', 'active'));

CREATE POLICY "companies_authenticated_tenant_read"
ON public.companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role = 'SUPER_ADMIN'
        OR p.tenant_id = companies.id
      )
  )
);

CREATE POLICY "companies_authenticated_tenant_update"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role = 'SUPER_ADMIN'
        OR p.tenant_id = companies.id
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role = 'SUPER_ADMIN'
        OR p.tenant_id = companies.id
      )
  )
);

CREATE POLICY "companies_authenticated_create"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "products_public_storefront_active_only"
ON public.products
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = products.tenant_id
      AND lower(coalesce(c.status, '')) IN ('ativo', 'active')
  )
);

CREATE POLICY "products_authenticated_tenant_read"
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role = 'SUPER_ADMIN'
        OR p.tenant_id = products.tenant_id
      )
  )
);

CREATE POLICY "products_authenticated_tenant_write"
ON public.products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role = 'SUPER_ADMIN'
        OR p.tenant_id = products.tenant_id
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role = 'SUPER_ADMIN'
        OR p.tenant_id = products.tenant_id
      )
  )
);

COMMIT;
