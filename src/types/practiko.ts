// Tipos oficiales para el módulo Practiko Carga e Instrucciones de Embarque
// Basado en el estándar de Practiko y la operación de INGELOX Logistics SAS

export type TipoPersona = 'juridica' | 'natural';
export type TipoId = 'NIT' | 'CC' | 'CE' | 'PA' | 'TI';

export interface ThirdParty {
  id: string;
  tipo_persona: TipoPersona;
  tipo_id: TipoId;
  identificacion: string;
  dv: string;
  razon_social: string;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
  primer_nombre?: string | null;
  segundo_nombre?: string | null;
  fecha_registro: string;
  // Ubicación y contacto
  direccion: string;
  telefono: string;
  pais: string;
  ciudad: string;
  correo_fe: string; // Correo Facturación Electrónica DIAN
  nombre_sucursal: string; // 'PRINCIPAL'
  // Datos comerciales
  vendedor?: string | null;
  dias_credito: number;
  email: string;
  autoriza_email: boolean;
  // Clasificación de tercero
  es_cliente: boolean;
  es_proveedor: boolean;
  es_empleado: boolean;
  es_socio: boolean;
  es_vendedor: boolean;
  otros: boolean;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface BillingConcept {
  id: string;
  codigo: string;
  nombre: string;
  aplica_iva: boolean;
  porcentaje_iva: number; // 0 o 19
  moneda_default: 'USD' | 'COP' | 'EUR';
  valor_sugerido?: number | null;
  categoria?: string | null;
  created_at?: string;
}

export interface QuotationItem {
  id: string;
  quotation_id?: string;
  orden: number;
  cantidad: number;
  concepto: string;
  valor_unitario: number;
  porcentaje_descuento: number;
  subtotal: number;
  iva: number;
  total: number;
}

export interface Quotation {
  id: string;
  consecutivo: string; // Ej: CS-2609-7
  fecha: string; // YYYY-MM-DD
  validez: string; // YYYY-MM-DD
  forma_pago: string; // Ej: 'A 30 DIAS', 'CONTADO'
  vendedor: string;
  atencion: string; // Contacto del cliente
  tercero_id?: string | null;
  cliente_nombre: string;
  cliente_nit: string;
  cliente_direccion: string;
  cliente_telefono: string;
  observaciones: string;
  condiciones: string[];
  subtotal: number;
  total_iva: number;
  total: number;
  moneda: 'USD' | 'COP' | 'EUR';
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada';
  items: QuotationItem[];
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ShippingInstructionConcept {
  id: string;
  instruction_id?: string;
  orden: number;
  concepto: string;
  vendido: number; // 1 = S, 0 = N
  proveedor?: string | null;
  forma_pago?: string | null; // Prepaid, Collect, etc.
  costo?: string | null;
  moneda_costo: string; // 'USD', 'COP'
  venta?: string | null;
  moneda_venta: string; // 'USD', 'COP'
  facturar_a?: string | null;
}

export interface ShippingInstruction {
  id: string;
  estado: 'borrador' | 'finalizada';
  do_number: string;
  fecha_creacion: string;
  comercial: string;
  oferta: string;
  cliente: string;
  credito: string;
  contacto: string;
  facturar_a: string;
  telefono: string;
  correo: string;
  incoterm: string;
  complemento: string;
  modalidad: string;
  ruta: string;
  via: string;
  tipo_de_embarque: string;
  comentarios: string;
  concepts: ShippingInstructionConcept[];
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}
