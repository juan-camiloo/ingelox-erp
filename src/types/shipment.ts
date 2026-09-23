export type ShipmentTypeValue = 'air' | 'maritime' | 'land';
export type ShipmentOperationType = 'expo' | 'impo';

export interface Shipment {
  id: string;
  do_number: string;
  origin: string;
  destination: string;
  shipment_type?: ShipmentTypeValue | null;
  current_status?: string | null;
  incoterm?: string | null;
  etd?: string | null;
  eta?: string | null;
  atd?: string | null;
  ata?: string | null;
  documentary_cutoff?: string | null;
  booking_status?: string | null;
  inspection_status?: string | null;
  cargo_type?: string | null;
  free_days?: number | null;
  carrier?: string | null;
  flight_vessel?: string | null;
  air_waybill?: string | null;
  container_number?: string | null;
  exporter?: string | null;
  consignee?: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  // Campos computados / anexados
  latest_status_at?: string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  assigned_clients?: { id: string; nickname?: string; email: string }[];
  assigned_companies?: { id: string; name: string }[];
}

export interface ShipmentUpdate {
  id: string;
  shipment_id: string;
  status: string;
  description: string;
  location?: string | null;
  created_at: string;
  created_by?: string | null;
  media_url?: string | null;
  created_by_name?: string | null;
}

export interface DocumentRecord {
  id: string;
  shipment_id: string;
  file_name: string;
  file_size: number;
  file_path?: string | null;
  storage_path?: string | null;
  created_at?: string | null;
  created_by?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname?: string | null;
  is_internal: boolean;
  company_id?: string | null;
  status?: 'active' | 'inactive';
  role?: string | null;
  created_at?: string;
  company?: {
    id: string;
    name: string;
  };
}

export interface Company {
  id: string;
  name: string;
  nit?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  created_at?: string;
}

// Estados organizados por tipo de operación
export const STATUS_OPTIONS_BY_OPERATION: Record<ShipmentOperationType, { label: string; value: string; step: number }[]> = {
  expo: [
    { label: 'Inicio de Operación', value: 'expo_start_operation', step: 1 },
    { label: 'Confirmación de Booking', value: 'expo_booking_confirmation', step: 2 },
    { label: 'Posicionamiento Vehículo', value: 'expo_vehicle', step: 3 },
    { label: 'Documentación / Cutoff', value: 'expo_documentation', step: 4 },
    { label: 'Salida / Zarpe', value: 'expo_departure', step: 5 },
    { label: 'Tránsito Internacional', value: 'expo_international_transit', step: 6 },
    { label: 'Llegada a Destino', value: 'expo_arrival_confirmation', step: 7 },
  ],
  impo: [
    { label: 'Inicio de Operación', value: 'impo_start_operation', step: 1 },
    { label: 'Radicación / Filling', value: 'impo_filling', step: 2 },
    { label: 'Documentación / Bls', value: 'impo_documentation', step: 3 },
    { label: 'Salida Puerto Origen', value: 'impo_departure', step: 4 },
    { label: 'Tránsito Internacional', value: 'impo_international_transit', step: 5 },
    { label: 'Proceso Aduanero', value: 'impo_customs', step: 6 },
    { label: 'Confirmación de Arribo', value: 'impo_arrival_confirmation', step: 7 },
    { label: 'Tránsito Nacional / Entrega', value: 'impo_national_transit', step: 8 },
  ],
};

export const STATUS_LABELS: Record<string, string> = {
  expo_start_operation: 'Inicio de Operación',
  expo_booking_confirmation: 'Confirmación de Booking',
  expo_vehicle: 'Posicionamiento Vehículo',
  expo_documentation: 'Documentación',
  expo_departure: 'Salida / Zarpe',
  expo_international_transit: 'Tránsito Internacional',
  expo_arrival_confirmation: 'Llegada a Destino',
  impo_start_operation: 'Inicio de Operación',
  impo_filling: 'Radicación / Filling',
  impo_documentation: 'Documentación',
  impo_departure: 'Salida Puerto Origen',
  impo_international_transit: 'Tránsito Internacional',
  impo_customs: 'Proceso Aduanero',
  impo_arrival_confirmation: 'Confirmación de Arribo',
  impo_national_transit: 'Tránsito Nacional',
  on_way: 'En Camino',
  waiting_inspection: 'Inspección',
  arrived: 'Arribado / Finalizado',
};

export const INCOTERMS = [
  'EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'
] as const;

export const CARGO_TYPES = [
  { label: 'Carga General', value: 'general' },
  { label: 'Carga Peligrosa (IMO / Hazmat)', value: 'dangerous' },
  { label: 'Perecederos', value: 'perishable' },
  { label: 'Refrigerada', value: 'refrigerated' },
  { label: 'Químicos', value: 'chemicals' },
  { label: 'Granel Seco', value: 'dry_bulk' },
  { label: 'Granel Líquido', value: 'liquid_bulk' },
  { label: 'Carga Proyecto / Sobredimensionada', value: 'project_cargo' },
  { label: 'Valiosa', value: 'valuable' },
  { label: 'Farmacéutica', value: 'pharma' },
  { label: 'Ro-Ro', value: 'roro' },
  { label: 'Animales Vivos', value: 'live_animals' },
];

export const BOOKING_STATUSES = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Rechazado', value: 'rejected' },
  { label: 'En espera de naviera/aerolínea', value: 'waiting_carrier' },
];

export const INSPECTION_STATUSES = [
  { label: 'Sin inspección', value: 'none' },
  { label: 'Documental', value: 'documentary' },
  { label: 'Física', value: 'physical' },
  { label: 'Liberado', value: 'released' },
  { label: 'Levante automático', value: 'automatic' },
];

export function inferShipmentOperationType(doNumber?: string | null): ShipmentOperationType | null {
  const normalized = doNumber?.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized.startsWith('X') || normalized.startsWith('EXP')) return 'expo';
  if (normalized.startsWith('M') || normalized.startsWith('IMP')) return 'impo';
  return null;
}

export function getShipmentStatusLabel(status?: string | null): string {
  if (!status) return 'Sin Estado';
  return STATUS_LABELS[status] || status;
}
