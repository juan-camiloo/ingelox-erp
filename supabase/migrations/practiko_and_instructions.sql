-- ==============================================================================
-- INGELOX ERP: ESQUEMA PRACTIKO (TERCEROS, CONCEPTOS, COTIZACIONES)
-- E INSTRUCCIONES DE EMBARQUE
-- ==============================================================================

-- 1. TABLA DE TERCEROS (Clientes, Proveedores, Vendedores, etc.)
CREATE TABLE IF NOT EXISTS public.third_parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_persona TEXT NOT NULL CHECK (tipo_persona IN ('juridica', 'natural')),
    tipo_id TEXT NOT NULL DEFAULT 'NIT',
    identificacion TEXT NOT NULL,
    dv TEXT,
    razon_social TEXT NOT NULL,
    primer_apellido TEXT,
    segundo_apellido TEXT,
    primer_nombre TEXT,
    segundo_nombre TEXT,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    direccion TEXT,
    telefono TEXT,
    pais TEXT DEFAULT 'Colombia',
    ciudad TEXT DEFAULT 'Bogotá D.C.',
    correo_fe TEXT,
    nombre_sucursal TEXT DEFAULT 'PRINCIPAL',
    vendedor TEXT,
    dias_credito INTEGER DEFAULT 0,
    email TEXT,
    autoriza_email BOOLEAN DEFAULT TRUE,
    es_cliente BOOLEAN DEFAULT TRUE,
    es_proveedor BOOLEAN DEFAULT FALSE,
    es_empleado BOOLEAN DEFAULT FALSE,
    es_socio BOOLEAN DEFAULT FALSE,
    es_vendedor BOOLEAN DEFAULT FALSE,
    otros BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE CONCEPTOS DE FACTURACIÓN
CREATE TABLE IF NOT EXISTS public.billing_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    aplica_iva BOOLEAN DEFAULT FALSE,
    porcentaje_iva NUMERIC DEFAULT 0,
    moneda_default TEXT DEFAULT 'USD',
    valor_sugerido NUMERIC DEFAULT 0,
    categoria TEXT DEFAULT 'Servicio',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE COTIZACIONES (Practiko Carga)
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consecutivo TEXT UNIQUE NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    validez DATE,
    forma_pago TEXT DEFAULT 'A 30 DIAS',
    vendedor TEXT,
    atencion TEXT,
    tercero_id UUID REFERENCES public.third_parties(id) ON DELETE SET NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_nit TEXT,
    cliente_direccion TEXT,
    cliente_telefono TEXT,
    observaciones TEXT,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    total_iva NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    moneda TEXT DEFAULT 'USD',
    estado TEXT DEFAULT 'enviada' CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada')),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL DEFAULT 1,
    cantidad NUMERIC NOT NULL DEFAULT 1,
    concepto TEXT NOT NULL,
    valor_unitario NUMERIC NOT NULL DEFAULT 0,
    porcentaje_descuento NUMERIC DEFAULT 0,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    iva NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0
);

-- 4. TABLA DE INSTRUCCIONES DE EMBARQUE
CREATE TABLE IF NOT EXISTS public.shipping_instructions (
    id TEXT PRIMARY KEY,
    estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'finalizada')),
    do_number TEXT NOT NULL,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    comercial TEXT,
    oferta TEXT,
    cliente TEXT,
    credito TEXT,
    contacto TEXT,
    facturar_a TEXT,
    telefono TEXT,
    correo TEXT,
    incoterm TEXT,
    complemento TEXT,
    modalidad TEXT,
    ruta TEXT,
    via TEXT,
    tipo_de_embarque TEXT,
    comentarios TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipping_instruction_concepts (
    id TEXT PRIMARY KEY,
    instruction_id TEXT NOT NULL REFERENCES public.shipping_instructions(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL DEFAULT 0,
    concepto TEXT NOT NULL,
    vendido INTEGER NOT NULL DEFAULT 1,
    proveedor TEXT,
    forma_pago TEXT,
    costo TEXT,
    moneda_costo TEXT DEFAULT 'USD',
    venta TEXT,
    moneda_venta TEXT DEFAULT 'USD',
    facturar_a TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS y políticas para usuarios internos
ALTER TABLE public.third_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_instruction_concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal full access on third_parties" ON public.third_parties
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_internal = true));

CREATE POLICY "Internal full access on billing_concepts" ON public.billing_concepts
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_internal = true));

CREATE POLICY "Internal full access on quotations" ON public.quotations
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_internal = true));

CREATE POLICY "Internal full access on quotation_items" ON public.quotation_items
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_internal = true));

CREATE POLICY "Internal full access on shipping_instructions" ON public.shipping_instructions
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_internal = true));

CREATE POLICY "Internal full access on shipping_instruction_concepts" ON public.shipping_instruction_concepts
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_internal = true));
