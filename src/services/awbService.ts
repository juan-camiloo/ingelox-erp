import { supabase } from '../lib/supabase';
import type { AirWaybill } from '../types/awb';

const STORAGE_KEY = 'ingelox_air_waybills';

// Initial mock data based on the official template for seamless testing
const DEFAULT_AWBS: AirWaybill[] = [
  {
    id: 'awb-729-45241232',
    do_number: 'EXP-26042',
    airline_code: '729',
    awb_number: '45241232',
    full_awb_number: '729-45241232',
    airline_name: 'Tampa Cargo S.A.S',
    status: 'emitida',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // Shipper
    shipper_name: 'INGELOX S.A.S.',
    shipper_nit: '900.526.917-1',
    shipper_address: 'CARRERA 61 No. 100 - 78',
    shipper_phone: '(601) 4650855',
    shipper_city_country: 'Bogotá, Colombia C.P. 111211',
    shipper_email: 'Ingelox@ingelox.com',
    shipper_account_no: '',

    // Consignee
    consignee_name: 'LINK GL SA DE CV',
    consignee_tax_id: 'LGL1508272X3',
    consignee_address: 'AV. INSURGENTES SUR 716, 8-A, COL. DEL VALLE NORTE, BENITO JUAREZ, C.P. 03103',
    consignee_phone: '0155 8880 1637 Ext. 121',
    consignee_city_country: 'CDMX, MEXICO',
    consignee_email: 'customerservice@linkgl.com',

    // Agent
    agent_name: 'INGELOX S.A.S.',
    agent_nit: '900.526.917-1',
    agent_city_country: 'Bogotá, Colombia',
    agent_iata_code: '76-1 0215/0003',
    agent_account_no: '',

    // Routing
    origin_city: 'Bogota - Colombia',
    origin_airport_code: 'BOG',
    dest_airport_code: 'MEX',
    first_carrier_acronym: 'Tampa Cargo S.A.S (QT)',
    dest_city: 'CDMX - MEXICO',
    flight_number: 'AV0072',
    flight_date: new Date().toISOString().split('T')[0],

    // Conditions
    currency: 'USD',
    chgs_code: '',
    wt_val_payment: 'PPD',
    other_payment: 'PPD',
    declared_value_carriage: 'N.V.D.',
    declared_value_customs: 'N.C.V.',
    amount_insurance: 'N.I.L.',
    handling_information: 'ATTACHED DOCUMENTS - CONSOLIDATED AS PER ATTACHED CARGO MANIFEST',
    trm: 3208.66,

    // Cargo
    cargo: {
      pieces: 31,
      gross_weight: 2777.5,
      weight_unit: 'k',
      chargeable_weight: 2777.5,
      rate_class: 'Q',
      rate_charge_type: 'numeric',
      rate_charge_value: 0.90,
      rate_charge_display: '0.90',
      total_charge_display: '2499.75',
      nature_and_quantity: `CONSOLIDATED AS PER ATTACHED\nCARGO MANIFEST\nDIMS: CM QTY 4\nINVOICE: FX44239-FX44238-FX44237\nSAE: 6027775834299\nOA: OA953058\nHS CODE: 7609.00.00.00`,
    },

    // Other charges
    other_charges_line1: 'FS: 0,26 X KILO',
    due_agent_prepaid: 0,
    due_agent_collect: 0,
    due_carrier_prepaid: 722.15,
    due_carrier_collect: 0,
    valuation_charge_prepaid: 0,
    valuation_charge_collect: 0,
    tax_prepaid: 0,
    tax_collect: 0,
    total_prepaid: 3221.90, // 2499.75 + 722.15
    total_collect: 0,

    // Signatures
    shipper_certification: 'WE CERTIFY TO KNOW THE EXPORTER AND HIS ACTIVITIES LIKE RESPONSIBLE ORGANIZATION / CERTIFICAMOS CONOCER AL EXPORTADOR COMO UNA ENTIDAD SERIA Y RESPONSABLE',
    executed_date: new Date().toISOString().split('T')[0],
    executed_place: 'Bogota, Colombia',
    carrier_signature: 'INGELOX S.A.S.',

    // HAWBs
    hawbs: [
      {
        id: 'hawb-1',
        hawb_number: 'X26665',
        shipper_name: 'SOLDEXEL S.A.S.',
        shipper_nit: '900.106.777-5',
        shipper_address: 'Calle 22 Sur No 27-50',
        shipper_phone: '601 7561886',
        shipper_city_country: 'Bogotá, Colombia',
        shipper_email: 'comercioexterior@soldexel.com',
        consignee_name: 'RECUBRIMIENTOS PLASTICOS DEL SURESTE SA DE CV',
        consignee_tax_id: 'RPS950519N74',
        consignee_address: 'AV. EL MARQUES No. 70, NAVE 1, PARQUE IND B QUINTANA, EL MARQUES, C.P. 76246',
        consignee_phone: '(+52) 921 212 1959',
        consignee_city_country: 'QUERETARO, MEXICO',
        handling_information: 'ATTACHED DOCUMENTS',
        pieces: 31,
        gross_weight: 2777.5,
        weight_unit: 'k',
        chargeable_weight: 2777.5,
        rate_charge_display: 'AS AGREED',
        total_charge_display: 'AS AGREED',
        nature_and_quantity: `ALUMINIO Y SUS MANUFACTURAS – ACCESORIOS\nDIMS: 13=69*64*44  3=80*51*74  15=69*62*65 CM QTY 4\nINVOICE: FX44239-FX44238-FX44237\nSAE: 6027775834299\nHS CODE: 7609.00.00.00`,
        other_charges_line1: 'AS AGREED',
        weight_charge_display: 'AS AGREED',
        total_charges_display: 'AS AGREED',
      },
    ],
  },
];

export const AwbService = {
  async getAwbs(): Promise<AirWaybill[]> {
    try {
      const { data, error } = await supabase
        .from('air_waybills')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as AirWaybill[];
      }
    } catch {}

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_AWBS));
    return DEFAULT_AWBS;
  },

  async getAwbById(id: string): Promise<AirWaybill | null> {
    const list = await this.getAwbs();
    return list.find((a) => a.id === id) || null;
  },

  async saveAwb(awbData: Partial<AirWaybill>): Promise<AirWaybill> {
    const list = await this.getAwbs();
    const nowIso = new Date().toISOString();
    const id = awbData.id || `awb-${Date.now()}`;

    const airlineCode = (awbData.airline_code || '729').trim();
    const awbNum = (awbData.awb_number || '').trim();
    const fullAwb = `${airlineCode}-${awbNum}`;

    const completeAwb: AirWaybill = {
      id,
      do_number: awbData.do_number || '',
      airline_code: airlineCode,
      awb_number: awbNum,
      full_awb_number: fullAwb,
      airline_name: awbData.airline_name || 'Tampa Cargo S.A.S',
      status: awbData.status || 'emitida',
      created_at: awbData.created_at || nowIso,
      updated_at: nowIso,

      shipper_name: awbData.shipper_name || 'INGELOX S.A.S.',
      shipper_nit: awbData.shipper_nit || '900.526.917-1',
      shipper_address: awbData.shipper_address || 'CARRERA 61 No. 100 - 78',
      shipper_phone: awbData.shipper_phone || '(601) 4650855',
      shipper_city_country: awbData.shipper_city_country || 'Bogotá, Colombia C.P. 111211',
      shipper_email: awbData.shipper_email || 'Ingelox@ingelox.com',
      shipper_account_no: awbData.shipper_account_no || '',

      consignee_name: awbData.consignee_name || '',
      consignee_tax_id: awbData.consignee_tax_id || '',
      consignee_address: awbData.consignee_address || '',
      consignee_phone: awbData.consignee_phone || '',
      consignee_city_country: awbData.consignee_city_country || '',
      consignee_email: awbData.consignee_email || '',
      consignee_account_no: awbData.consignee_account_no || '',

      agent_name: awbData.agent_name || 'INGELOX S.A.S.',
      agent_nit: awbData.agent_nit || '900.526.917-1',
      agent_city_country: awbData.agent_city_country || 'Bogotá, Colombia',
      agent_iata_code: awbData.agent_iata_code || '76-1 0215/0003',
      agent_account_no: awbData.agent_account_no || '',

      origin_city: awbData.origin_city || 'Bogota - Colombia',
      origin_airport_code: (awbData.origin_airport_code || 'BOG').toUpperCase(),
      dest_airport_code: (awbData.dest_airport_code || '').toUpperCase(),
      first_carrier_acronym: awbData.first_carrier_acronym || '',
      to_2nd: awbData.to_2nd || '',
      by_2nd: awbData.by_2nd || '',
      to_3rd: awbData.to_3rd || '',
      by_3rd: awbData.by_3rd || '',
      dest_city: awbData.dest_city || '',
      flight_number: awbData.flight_number || '',
      flight_date: awbData.flight_date || '',

      currency: awbData.currency || 'USD',
      chgs_code: awbData.chgs_code || '',
      wt_val_payment: awbData.wt_val_payment || 'PPD',
      other_payment: awbData.other_payment || 'PPD',
      declared_value_carriage: awbData.declared_value_carriage || 'N.V.D.',
      declared_value_customs: awbData.declared_value_customs || 'N.C.V.',
      amount_insurance: awbData.amount_insurance || 'N.I.L.',
      handling_information: awbData.handling_information || 'ATTACHED DOCUMENTS',
      trm: awbData.trm || 0,
      accounting_information: awbData.accounting_information || '',

      cargo: awbData.cargo || {
        pieces: 1,
        gross_weight: 1,
        weight_unit: 'k',
        chargeable_weight: 1,
        rate_class: 'Q',
        rate_charge_type: 'as_agreed',
        rate_charge_display: 'AS AGREED',
        total_charge_display: 'AS AGREED',
        nature_and_quantity: 'GENERAL CARGO',
      },

      other_charges_line1: awbData.other_charges_line1 || '',
      other_charges_line2: awbData.other_charges_line2 || '',
      other_charges_line3: awbData.other_charges_line3 || '',
      due_agent_prepaid: awbData.due_agent_prepaid || 0,
      due_agent_collect: awbData.due_agent_collect || 0,
      due_carrier_prepaid: awbData.due_carrier_prepaid || 0,
      due_carrier_collect: awbData.due_carrier_collect || 0,
      valuation_charge_prepaid: awbData.valuation_charge_prepaid || 0,
      valuation_charge_collect: awbData.valuation_charge_collect || 0,
      tax_prepaid: awbData.tax_prepaid || 0,
      tax_collect: awbData.tax_collect || 0,
      total_prepaid: awbData.total_prepaid || 0,
      total_collect: awbData.total_collect || 0,

      shipper_certification:
        awbData.shipper_certification ||
        'WE CERTIFY TO KNOW THE EXPORTER AND HIS ACTIVITIES LIKE RESPONSIBLE ORGANIZATION / CERTIFICAMOS CONOCER AL EXPORTADOR COMO UNA ENTIDAD SERIA Y RESPONSABLE',
      executed_date: awbData.executed_date || nowIso.split('T')[0],
      executed_place: awbData.executed_place || 'Bogota, Colombia',
      carrier_signature: awbData.carrier_signature || 'INGELOX S.A.S.',

      hawbs: awbData.hawbs || [],
    };

    try {
      await supabase.from('air_waybills').upsert(completeAwb);
    } catch {}

    const index = list.findIndex((a) => a.id === id);
    if (index >= 0) {
      list[index] = completeAwb;
    } else {
      list.unshift(completeAwb);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return completeAwb;
  },

  async deleteAwb(id: string): Promise<void> {
    try {
      await supabase.from('air_waybills').delete().eq('id', id);
    } catch {}

    const list = await this.getAwbs();
    const filtered = list.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  async updateAwbStatus(id: string, status: 'borrador' | 'emitida' | 'anulada'): Promise<void> {
    const list = await this.getAwbs();
    const item = list.find((a) => a.id === id);
    if (item) {
      item.status = status;
      item.updated_at = new Date().toISOString();
      await this.saveAwb(item);
    }
  },
};
