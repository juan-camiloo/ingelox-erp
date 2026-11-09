import { supabase } from '../lib/supabase';
import type {
  ThirdParty,
  BillingConcept,
  Quotation,
  ShippingInstruction,
} from '../types/commercial';

// Claves de almacenamiento local de respaldo
const STORAGE_KEYS = {
  thirdParties: 'ingelox_third_parties',
  billingConcepts: 'ingelox_billing_concepts',
  quotations: 'ingelox_quotations',
  instructions: 'ingelox_instructions',
};

// ─────────────────────────────────────────────────────────────────────────────
// SEMILLAS PREDETERMINADAS (Basadas en la operación real de INGELOX)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_BILLING_CONCEPTS: BillingConcept[] = [
  { id: 'bc-1', codigo: 'IN - TRANSPORTE TERRESTRE URBANO', nombre: 'Transporte Terrestre Urbano', aplica_iva: false, porcentaje_iva: 0, moneda_default: 'USD', valor_sugerido: 75, categoria: 'Terrestre' },
  { id: 'bc-2', codigo: 'IN - FLETE AÉREO INTERNACIONAL', nombre: 'Flete Aéreo Internacional', aplica_iva: false, porcentaje_iva: 0, moneda_default: 'USD', valor_sugerido: 380, categoria: 'Flete' },
  { id: 'bc-3', codigo: 'IN - FLETE MARÍTIMO INTERNACIONAL', nombre: 'Flete Marítimo Internacional', aplica_iva: false, porcentaje_iva: 0, moneda_default: 'USD', valor_sugerido: 1200, categoria: 'Flete' },
  { id: 'bc-4', codigo: 'IN - MANEJO AEROLINEA DUE CARRIER', nombre: 'Manejo Aerolínea Due Carrier', aplica_iva: false, porcentaje_iva: 0, moneda_default: 'USD', valor_sugerido: 60, categoria: 'Portuario/Aeroportuario' },
  { id: 'bc-5', codigo: 'IN - ELABORACION FORMULARIO DE MERCANCIAS PELIGROSAS', nombre: 'Elaboración Formulario Mercancías Peligrosas', aplica_iva: true, porcentaje_iva: 19, moneda_default: 'USD', valor_sugerido: 75, categoria: 'Documental' },
  { id: 'bc-6', codigo: 'IN - ELABORACION DE GUIA AEREA', nombre: 'Elaboración de Guía Aérea', aplica_iva: true, porcentaje_iva: 19, moneda_default: 'USD', valor_sugerido: 50, categoria: 'Documental' },
  { id: 'bc-7', codigo: 'IN - INSPECCIÓN DE SEGURIDAD', nombre: 'Inspección de Seguridad', aplica_iva: true, porcentaje_iva: 19, moneda_default: 'USD', valor_sugerido: 120, categoria: 'Seguridad' },
  { id: 'bc-8', codigo: 'IN - RECARGO AEROLINEA POR CARGA PELIGROSA', nombre: 'Recargo Aerolínea Carga Peligrosa', aplica_iva: false, porcentaje_iva: 0, moneda_default: 'USD', valor_sugerido: 150, categoria: 'Recargo' },
  { id: 'bc-9', codigo: 'IN - MANEJO INGELOX', nombre: 'Manejo Ingelox', aplica_iva: true, porcentaje_iva: 19, moneda_default: 'USD', valor_sugerido: 75, categoria: 'Agenciamiento' },
  { id: 'bc-10', codigo: 'IN - AGENCIONAMIENTO ADUANERO', nombre: 'Agenciamiento Aduanero', aplica_iva: true, porcentaje_iva: 19, moneda_default: 'USD', valor_sugerido: 180, categoria: 'Aduana' },
];

export const DEFAULT_THIRD_PARTIES: ThirdParty[] = [
  {
    id: 'tp-albaugh',
    tipo_persona: 'juridica',
    tipo_id: 'NIT',
    identificacion: '830090754',
    dv: '0',
    razon_social: 'ALBAUGH COLOMBIA S.A.S.',
    fecha_registro: '2026-09-14',
    direccion: 'CARRERA 22 NO. 98-82 OF 703',
    telefono: '573192156833',
    pais: 'Colombia',
    ciudad: 'Bogotá D.C.',
    correo_fe: 'facturacion@albaugh.com.co',
    nombre_sucursal: 'PRINCIPAL',
    vendedor: 'LUENGAS ACOSTA DANIEL ARTURO',
    dias_credito: 30,
    email: 'contacto@albaugh.com.co',
    autoriza_email: true,
    es_cliente: true,
    es_proveedor: false,
    es_empleado: false,
    es_socio: false,
    es_vendedor: false,
    otros: false,
    status: 'active',
  },
  {
    id: 'tp-loceria',
    tipo_persona: 'juridica',
    tipo_id: 'NIT',
    identificacion: '890900162',
    dv: '4',
    razon_social: 'LOCERIA COLOMBIANA SAS',
    fecha_registro: '2026-08-01',
    direccion: 'CALLE 10 # 50-20',
    telefono: '5743810000',
    pais: 'Colombia',
    ciudad: 'Medellín',
    correo_fe: 'contabilidad@loceria.com',
    nombre_sucursal: 'PRINCIPAL',
    vendedor: 'LUENGAS ACOSTA DANIEL ARTURO',
    dias_credito: 30,
    email: 'comercial@loceria.com',
    autoriza_email: true,
    es_cliente: true,
    es_proveedor: false,
    es_empleado: false,
    es_socio: false,
    es_vendedor: false,
    otros: false,
    status: 'active',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SERVICIO DE TERCEROS
// ─────────────────────────────────────────────────────────────────────────────

// Helper para verificar UUID válido
const isValidUuid = (val?: string | null): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
};

const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const ThirdPartyService = {
  async getThirdParties(): Promise<ThirdParty[]> {
    try {
      // 1. Intentar desde Supabase
      const { data, error } = await supabase
        .from('third_parties')
        .select('*')
        .order('razon_social', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map((item: any) => ({
          ...item,
          contact_name: item.contact_name || item.nombre_contacto || null,
          nombre_contacto: item.contact_name || item.nombre_contacto || null,
        })) as ThirdParty[];
        localStorage.setItem(STORAGE_KEYS.thirdParties, JSON.stringify(mapped));
        return mapped;
      }
    } catch {
      // Continuar al fallback local
    }

    // Fallback: localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.thirdParties);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }

    // Inicializar semillas
    localStorage.setItem(STORAGE_KEYS.thirdParties, JSON.stringify(DEFAULT_THIRD_PARTIES));
    return DEFAULT_THIRD_PARTIES;
  },

  async saveThirdParty(party: Partial<ThirdParty>): Promise<ThirdParty> {
    const list = await this.getThirdParties();
    // Supabase requiere tipo UUID estricto en la columna id
    const id = isValidUuid(party.id) ? (party.id as string) : generateUuid();
    const now = new Date().toISOString();

    const fullParty: ThirdParty = {
      id,
      tipo_persona: party.tipo_persona || 'juridica',
      tipo_id: party.tipo_id || 'NIT',
      identificacion: party.identificacion || '',
      dv: party.dv || '',
      razon_social: party.razon_social || '',
      primer_apellido: party.primer_apellido || null,
      segundo_apellido: party.segundo_apellido || null,
      primer_nombre: party.primer_nombre || null,
      segundo_nombre: party.segundo_nombre || null,
      fecha_registro: party.fecha_registro || now.split('T')[0],
      direccion: party.direccion || '',
      telefono: party.telefono || '',
      pais: party.pais || 'Colombia',
      ciudad: party.ciudad || 'Bogotá D.C.',
      correo_fe: party.correo_fe || '',
      nombre_sucursal: party.nombre_sucursal || 'PRINCIPAL',
      contact_name: party.contact_name || party.nombre_contacto || null,
      nombre_contacto: party.contact_name || party.nombre_contacto || null,
      vendedor: party.vendedor || 'LUENGAS ACOSTA DANIEL ARTURO',
      dias_credito: Number(party.dias_credito) || 0,
      email: party.email || '',
      autoriza_email: party.autoriza_email ?? true,
      es_cliente: party.es_cliente ?? true,
      es_proveedor: party.es_proveedor ?? false,
      es_empleado: party.es_empleado ?? false,
      es_socio: party.es_socio ?? false,
      es_vendedor: party.es_vendedor ?? false,
      otros: party.otros ?? false,
      status: party.status || 'active',
      updated_at: now,
      created_at: party.created_at || now,
    };

    // La base de datos de Supabase contiene únicamente la columna 'contact_name' (en inglés)
    const { nombre_contacto, ...dbPayload } = fullParty;

    // Intentar guardar en Supabase si la tabla existe
    try {
      const { error } = await supabase.from('third_parties').upsert(dbPayload);
      if (error) {
        console.error('Error guardando tercero en Supabase:', error);
      }
    } catch (err) {
      console.error('Excepción al conectar con Supabase:', err);
    }

    const index = list.findIndex((p) => p.id === id);
    if (index >= 0) {
      list[index] = fullParty;
    } else {
      list.push(fullParty);
    }

    localStorage.setItem(STORAGE_KEYS.thirdParties, JSON.stringify(list));
    return fullParty;
  },

  async deleteThirdParty(id: string): Promise<void> {
    try {
      if (isValidUuid(id)) {
        await supabase.from('third_parties').delete().eq('id', id);
      }
    } catch {}

    const list = (await this.getThirdParties()).filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.thirdParties, JSON.stringify(list));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICIO DE CONCEPTOS DE FACTURACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export const BillingConceptService = {
  async getConcepts(): Promise<BillingConcept[]> {
    try {
      const { data, error } = await supabase
        .from('billing_concepts')
        .select('*')
        .order('codigo', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as BillingConcept[];
      }
    } catch {}

    const stored = localStorage.getItem(STORAGE_KEYS.billingConcepts);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }

    localStorage.setItem(STORAGE_KEYS.billingConcepts, JSON.stringify(DEFAULT_BILLING_CONCEPTS));
    return DEFAULT_BILLING_CONCEPTS;
  },

  async saveConcept(concept: Partial<BillingConcept>): Promise<BillingConcept> {
    const list = await this.getConcepts();
    const id = concept.id || `bc-${Date.now()}`;
    const fullConcept: BillingConcept = {
      id,
      codigo: concept.codigo || '',
      nombre: concept.nombre || '',
      aplica_iva: concept.aplica_iva ?? false,
      porcentaje_iva: concept.porcentaje_iva ?? (concept.aplica_iva ? 19 : 0),
      moneda_default: concept.moneda_default || 'USD',
      valor_sugerido: concept.valor_sugerido || 0,
      categoria: concept.categoria || 'Servicio',
      created_at: concept.created_at || new Date().toISOString(),
    };

    try {
      await supabase.from('billing_concepts').upsert(fullConcept);
    } catch {}

    const index = list.findIndex((c) => c.id === id);
    if (index >= 0) {
      list[index] = fullConcept;
    } else {
      list.push(fullConcept);
    }

    localStorage.setItem(STORAGE_KEYS.billingConcepts, JSON.stringify(list));
    return fullConcept;
  },

  async deleteConcept(id: string): Promise<void> {
    try {
      await supabase.from('billing_concepts').delete().eq('id', id);
    } catch {}

    const list = await this.getConcepts();
    const filtered = list.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.billingConcepts, JSON.stringify(filtered));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICIO DE COTIZACIONES
// ─────────────────────────────────────────────────────────────────────────────

export const QuotationService = {
  async getQuotations(): Promise<Quotation[]> {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, items:quotation_items(*)')
        .order('fecha', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Quotation[];
      }
    } catch {}

    const stored = localStorage.getItem(STORAGE_KEYS.quotations);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }

    // Semilla inicial con la cotización representativa CS-2609-7
    const sampleQuotation: Quotation = {
      id: 'quote-sample-cs2609-7',
      consecutivo: 'CS-2609-7',
      fecha: '2026-09-16',
      validez: '2026-10-16',
      forma_pago: 'A 30 DIAS',
      vendedor: 'LUENGAS ACOSTA DANIEL ARTURO',
      atencion: 'EDWIN PULIDO',
      cliente_nombre: 'ALBAUGH COLOMBIA S.A.S.',
      cliente_nit: '830090754',
      cliente_direccion: 'CARRERA 22 NO. 98-82 OF 703',
      cliente_telefono: '573192156833',
      observaciones: 'EXP AEREA BOG - GDL 1 CAJA 25 KG IMO 9 UN3082 DIM: 42x40x50 cm',
      condiciones: [],
      subtotal: 985,
      total_iva: 47,
      total: 1032,
      moneda: 'USD',
      trm_usd: 4150,
      trm_eur: 4500,
      monedas_mostrar: ['USD', 'COP'],
      totales_normalizados: {
        USD: { subtotal: 985.00, total_iva: 47.00, total: 1032.00 },
        COP: { subtotal: 4087750.00, total_iva: 195050.00, total: 4282800.00 },
      },
      estado: 'enviada',
      items: [
        { id: '1', orden: 1, cantidad: 1, concepto: 'IN - TRANSPORTE TERRESTRE URBANO', valor_unitario: 75, porcentaje_descuento: 0, subtotal: 75, iva: 0, total: 75, moneda: 'USD' },
        { id: '2', orden: 2, cantidad: 1, concepto: 'IN - FLETE AÉREO INTERNACIONAL', valor_unitario: 380, porcentaje_descuento: 0, subtotal: 380, iva: 0, total: 380, moneda: 'USD' },
        { id: '3', orden: 3, cantidad: 1, concepto: 'IN - MANEJO AEROLINEA DUE CARRIER', valor_unitario: 60, porcentaje_descuento: 0, subtotal: 60, iva: 0, total: 60, moneda: 'USD' },
        { id: '4', orden: 4, cantidad: 1, concepto: 'IN - ELABORACION FORMULARIO DE MERCANCIAS PELIGROSAS', valor_unitario: 75, porcentaje_descuento: 0, subtotal: 75, iva: 14, total: 89, moneda: 'USD' },
        { id: '5', orden: 5, cantidad: 1, concepto: 'IN - ELABORACION DE GUIA AEREA', valor_unitario: 50, porcentaje_descuento: 0, subtotal: 50, iva: 10, total: 60, moneda: 'USD' },
        { id: '6', orden: 6, cantidad: 1, concepto: 'IN - INSPECCIÓN DE SEGURIDAD', valor_unitario: 120, porcentaje_descuento: 0, subtotal: 120, iva: 23, total: 143, moneda: 'USD' },
        { id: '7', orden: 7, cantidad: 1, concepto: 'IN - RECARGO AEROLINEA POR CARGA PELIGROSA', valor_unitario: 150, porcentaje_descuento: 0, subtotal: 150, iva: 0, total: 150, moneda: 'USD' },
        { id: '8', orden: 8, cantidad: 1, concepto: 'IN - MANEJO INGELOX', valor_unitario: 75, porcentaje_descuento: 0, subtotal: 75, iva: 14, total: 89, moneda: 'USD' },
      ],
    };

    localStorage.setItem(STORAGE_KEYS.quotations, JSON.stringify([sampleQuotation]));
    return [sampleQuotation];
  },

  async generateNextConsecutive(): Promise<string> {
    const list = await this.getQuotations();
    const now = new Date();
    const yearShort = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `CS-${yearShort}${month}-`;

    const currentNumbers = list
      .filter((q) => q.consecutivo.startsWith(prefix))
      .map((q) => {
        const numPart = q.consecutivo.replace(prefix, '');
        return parseInt(numPart, 10) || 0;
      });

    const max = currentNumbers.length > 0 ? Math.max(...currentNumbers) : 0;
    return `${prefix}${max + 1}`;
  },

  async saveQuotation(quote: Quotation): Promise<Quotation> {
    const list = await this.getQuotations();
    const quotationId = isValidUuid(quote.id) ? quote.id : generateUuid();
    const fullQuote: Quotation = {
      ...quote,
      id: quotationId,
      trm_usd: quote.trm_usd ?? null,
      trm_eur: quote.trm_eur ?? null,
      monedas_mostrar: quote.monedas_mostrar && quote.monedas_mostrar.length > 0 ? quote.monedas_mostrar : [quote.moneda || 'USD'],
      totales_normalizados: quote.totales_normalizados || {},
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('quotations').upsert({
        id: quotationId,
        consecutivo: fullQuote.consecutivo,
        fecha: fullQuote.fecha,
        validez: fullQuote.validez,
        forma_pago: fullQuote.forma_pago,
        vendedor: fullQuote.vendedor,
        atencion: fullQuote.atencion,
        tercero_id: isValidUuid(fullQuote.tercero_id) ? fullQuote.tercero_id : null,
        cliente_nombre: fullQuote.cliente_nombre,
        cliente_nit: fullQuote.cliente_nit,
        cliente_direccion: fullQuote.cliente_direccion,
        cliente_telefono: fullQuote.cliente_telefono,
        observaciones: fullQuote.observaciones,
        subtotal: fullQuote.subtotal,
        total_iva: fullQuote.total_iva,
        total: fullQuote.total,
        moneda: fullQuote.moneda,
        estado: fullQuote.estado,
        trm_usd: fullQuote.trm_usd,
        trm_eur: fullQuote.trm_eur,
        monedas_mostrar: fullQuote.monedas_mostrar,
        totales_normalizados: fullQuote.totales_normalizados,
        updated_at: fullQuote.updated_at,
      });

      if (fullQuote.items && fullQuote.items.length > 0) {
        // Sincronizar ítems con moneda independiente
        await supabase.from('quotation_items').delete().eq('quotation_id', quotationId);
        const itemsPayload = fullQuote.items.map((it, idx) => ({
          id: isValidUuid(it.id) ? it.id : generateUuid(),
          quotation_id: quotationId,
          orden: idx + 1,
          cantidad: it.cantidad,
          concepto: it.concepto,
          valor_unitario: it.valor_unitario,
          porcentaje_descuento: it.porcentaje_descuento || 0,
          subtotal: it.subtotal,
          iva: it.iva,
          total: it.total,
          moneda: it.moneda || fullQuote.moneda || 'USD',
        }));
        await supabase.from('quotation_items').insert(itemsPayload);
      }
    } catch (err) {
      console.warn('Advertencia al sincronizar cotización en Supabase:', err);
    }

    const index = list.findIndex((q) => q.id === quotationId || q.consecutivo === fullQuote.consecutivo);
    if (index >= 0) {
      list[index] = fullQuote;
    } else {
      list.unshift(fullQuote);
    }

    localStorage.setItem(STORAGE_KEYS.quotations, JSON.stringify(list));
    return fullQuote;
  },

  async getQuotationById(id: string): Promise<Quotation | null> {
    const list = await this.getQuotations();
    return list.find((q) => q.id === id) || null;
  },

  async updateQuotationStatus(id: string, estado: Quotation['estado']): Promise<void> {
    const list = await this.getQuotations();
    const quote = list.find((q) => q.id === id);
    if (!quote) return;
    quote.estado = estado;
    await this.saveQuotation(quote);
  },

  async deleteQuotation(id: string): Promise<void> {
    try {
      await supabase.from('quotations').delete().eq('id', id);
    } catch {}

    const list = await this.getQuotations();
    const filtered = list.filter((q) => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.quotations, JSON.stringify(filtered));
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICIO DE INSTRUCCIONES DE EMBARQUE
// ─────────────────────────────────────────────────────────────────────────────

export const ShippingInstructionService = {
  async getInstructions(): Promise<ShippingInstruction[]> {
    try {
      const { data, error } = await supabase
        .from('shipping_instructions')
        .select('*, concepts:shipping_instruction_concepts(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as ShippingInstruction[];
      }
    } catch {}

    const stored = localStorage.getItem(STORAGE_KEYS.instructions);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }

    // Semilla inicial con las instrucciones históricas
    const initialSeed: ShippingInstruction[] = [
      {
        id: 'inst-1',
        do_number: 'DO-2608-01',
        estado: 'finalizada',
        fecha_creacion: '2026-08-11',
        comercial: 'LUENGAS ACOSTA DANIEL ARTURO',
        oferta: 'OF-0881',
        cliente: 'LOCERIA COLOMBIANA SAS',
        credito: 'SI-30',
        contacto: 'Juan Camilo',
        facturar_a: 'CLIENTE',
        telefono: '5743810000',
        correo: 'comercial@loceria.com',
        incoterm: 'DAP',
        complemento: 'BODEGA MEDELLIN',
        modalidad: 'LTL / LTL',
        ruta: 'BOG - MDE',
        via: 'TERRESTRE',
        tipo_de_embarque: 'NACIONAL',
        comentarios: 'Entregar con remisión y factura comercial en portería 2.',
        concepts: [
          { id: 'c1', orden: 1, concepto: 'Flete Terrestre Urbano', vendido: 1, proveedor: 'Coltanques', forma_pago: 'Prepaid', costo: '300', moneda_costo: 'USD', venta: '400', moneda_venta: 'USD', facturar_a: 'LOCERIA COLOMBIANA SAS' },
          { id: 'c2', orden: 2, concepto: 'Manejo Ingelox', vendido: 1, proveedor: 'Ingelox', forma_pago: 'Prepaid', costo: '30', moneda_costo: 'USD', venta: '75', moneda_venta: 'USD', facturar_a: 'LOCERIA COLOMBIANA SAS' },
        ],
      },
      {
        id: 'inst-4',
        do_number: 'X26666',
        estado: 'borrador',
        fecha_creacion: '2026-09-16',
        comercial: 'DANIEL LUENGAS',
        oferta: 'CS-2609-7',
        cliente: 'ALBAUGH COLOMBIA S.A.S.',
        credito: 'SI-30',
        contacto: 'EDWIN PULIDO',
        facturar_a: 'CLIENTE',
        telefono: '573192156833',
        correo: 'contacto@albaugh.com.co',
        incoterm: 'FCA',
        complemento: 'AEROPUERTO EL DORADO',
        modalidad: 'Avión carguero',
        ruta: 'BOG - GDL',
        via: 'AEREO',
        tipo_de_embarque: 'EXPORTACION',
        comentarios: 'EXP AEREA BOG - GDL 1 CAJA 25 KG IMO 9 UN3082 DIM: 42x40x50 cm',
        concepts: [
          { id: 'c10', orden: 1, concepto: 'IN - FLETE AÉREO INTERNACIONAL', vendido: 1, proveedor: 'Avianca Cargo', forma_pago: 'Prepaid', costo: '310', moneda_costo: 'USD', venta: '380', moneda_venta: 'USD', facturar_a: 'ALBAUGH COLOMBIA S.A.S.' },
          { id: 'c11', orden: 2, concepto: 'IN - INSPECCIÓN DE SEGURIDAD', vendido: 1, proveedor: 'Opaín', forma_pago: 'Prepaid', costo: '90', moneda_costo: 'USD', venta: '120', moneda_venta: 'USD', facturar_a: 'ALBAUGH COLOMBIA S.A.S.' },
        ],
      },
    ];

    localStorage.setItem(STORAGE_KEYS.instructions, JSON.stringify(initialSeed));
    return initialSeed;
  },

  async saveInstruction(inst: ShippingInstruction): Promise<ShippingInstruction> {
    const list = await this.getInstructions();
    const index = list.findIndex((i) => i.id === inst.id);

    try {
      await supabase.from('shipping_instructions').upsert({
        id: inst.id,
        do_number: inst.do_number,
        estado: inst.estado,
        fecha_creacion: inst.fecha_creacion,
        comercial: inst.comercial,
        oferta: inst.oferta,
        cliente: inst.cliente,
        credito: inst.credito,
        contacto: inst.contacto,
        facturar_a: inst.facturar_a,
        telefono: inst.telefono,
        correo: inst.correo,
        incoterm: inst.incoterm,
        complemento: inst.complemento,
        modalidad: inst.modalidad,
        ruta: inst.ruta,
        via: inst.via,
        tipo_de_embarque: inst.tipo_de_embarque,
        comentarios: inst.comentarios,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    if (index >= 0) {
      list[index] = inst;
    } else {
      list.unshift(inst);
    }

    localStorage.setItem(STORAGE_KEYS.instructions, JSON.stringify(list));
    return inst;
  },

  async getInstructionById(id: string): Promise<ShippingInstruction | null> {
    const list = await this.getInstructions();
    return list.find((i) => i.id === id) || null;
  },

  async updateInstructionStatus(id: string, estado: 'borrador' | 'finalizada'): Promise<void> {
    const list = await this.getInstructions();
    const inst = list.find((i) => i.id === id);
    if (!inst) return;
    inst.estado = estado;
    await this.saveInstruction(inst);
  },

  async deleteInstruction(id: string): Promise<void> {
    try {
      await supabase.from('shipping_instructions').delete().eq('id', id);
    } catch {}

    const list = await this.getInstructions();
    const filtered = list.filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.instructions, JSON.stringify(filtered));
  },
};

