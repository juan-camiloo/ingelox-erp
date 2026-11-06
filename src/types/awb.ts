export const AWB_COPY_OPTIONS = [
  'ORIGINAL 1 (FOR ISSUING CARRIER)',
  'ORIGINAL 2 (FOR CONSIGNEE/RECEIVER)',
  'ORIGINAL 3 (FOR SHIPPER)',
  'ORIGINAL 4 (A DELIVERY RECEIPT)',
  'COPY 5 (FOR VARIOUS PROPOUSE)',
  'COPY 6 (FOR VARIOUS PROPOUSE)',
  'COPY 7 (FOR VARIOUS PROPOUSE)',
  'COPY 8 (FOR VARIOUS PROPOUSE)',
] as const;

export type AwbCopyType = (typeof AWB_COPY_OPTIONS)[number];

export interface AwbCargoItem {
  pieces: number;
  gross_weight: number;
  weight_unit: 'k' | 'lb';
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  volumetric_weight?: number;
  chargeable_weight: number;
  rate_class: string; // 'Q', 'M', 'N', 'C'
  commodity_item_no?: string;
  rate_charge_type: 'numeric' | 'as_agreed';
  rate_charge_value?: number;
  rate_charge_display: string; // e.g. "0.90" or "AS AGREED"
  total_charge_display: string; // e.g. "2499.75" or "AS AGREED"
  nature_and_quantity: string;
}

export interface HouseAwb {
  id: string;
  hawb_number: string;
  shipper_name: string;
  shipper_nit: string;
  shipper_address: string;
  shipper_phone: string;
  shipper_city_country: string;
  shipper_email?: string;
  consignee_name: string;
  consignee_tax_id: string; // RFC, NIT, etc.
  consignee_address: string;
  consignee_phone: string;
  consignee_city_country: string;
  consignee_email?: string;
  handling_information: string;
  pieces: number;
  gross_weight: number;
  weight_unit: 'k' | 'lb';
  chargeable_weight: number;
  rate_charge_display: string; // "AS AGREED" or "0.90"
  total_charge_display: string; // "AS AGREED"
  nature_and_quantity: string;
  other_charges_line1?: string;
  other_charges_line2?: string;
  weight_charge_display: string;
  total_charges_display: string;
}

export interface AirWaybill {
  id: string;
  do_number?: string;
  airline_code: string; // e.g. "729"
  awb_number: string;   // e.g. "45241232"
  full_awb_number: string; // e.g. "729-45241232"
  airline_name: string; // e.g. "Tampa Cargo S.A.S"
  status: 'borrador' | 'emitida' | 'anulada';
  created_at: string;
  updated_at: string;

  // 1. Shipper
  shipper_name: string;
  shipper_nit: string;
  shipper_address: string;
  shipper_phone: string;
  shipper_city_country: string;
  shipper_email?: string;
  shipper_account_no?: string;

  // 2. Consignee
  consignee_name: string;
  consignee_tax_id?: string;
  consignee_address: string;
  consignee_phone: string;
  consignee_city_country: string;
  consignee_email?: string;
  consignee_account_no?: string;

  // 3. Issuing Carrier's Agent
  agent_name: string;
  agent_nit: string;
  agent_city_country: string;
  agent_iata_code: string;
  agent_account_no?: string;

  // 4. Routing
  origin_city: string;
  origin_airport_code: string;
  dest_airport_code: string;
  first_carrier_acronym: string;
  to_2nd?: string;
  by_2nd?: string;
  to_3rd?: string;
  by_3rd?: string;
  dest_city: string;
  flight_number: string;
  flight_date?: string;

  // 5. Conditions & Accounting
  currency: string; // default "USD"
  chgs_code?: string;
  wt_val_payment: 'PPD' | 'COLL'; // WT/VAL
  other_payment: 'PPD' | 'COLL';  // Other charges
  declared_value_carriage: string; // "N.V.D."
  declared_value_customs: string;  // "N.C.V."
  amount_insurance: string;        // "N.I.L."
  handling_information: string;
  trm?: number;
  accounting_information?: string;

  // 6. Rating & Cargo Details (MAWB)
  cargo: AwbCargoItem;

  // 7. Other Charges Breakdown
  other_charges_line1?: string; // e.g. "FS: 0,26 X KILO"
  other_charges_line2?: string;
  other_charges_line3?: string;
  due_agent_prepaid: number;
  due_agent_collect: number;
  due_carrier_prepaid: number;
  due_carrier_collect: number;
  valuation_charge_prepaid: number;
  valuation_charge_collect: number;
  tax_prepaid: number;
  tax_collect: number;
  total_prepaid: number;
  total_collect: number;

  // 8. Signatures & Execution
  shipper_certification: string;
  executed_date: string;
  executed_place: string;
  carrier_signature: string;

  // 9. Associated HAWBs
  hawbs: HouseAwb[];
}
