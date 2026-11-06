import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
  Printer,
  Plus,
  Trash2,
  Calculator,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AwbService } from '../services/awbService';
import { ThirdPartyService } from '../services/commercialService';
import { supabase } from '../lib/supabase';
import { DraftStorage } from '../lib/draftStorage';
import type { AirWaybill, HouseAwb } from '../types/awb';
import type { ThirdParty } from '../types/commercial';
import type { Shipment } from '../types/shipment';
import { useAwbExcelGenerator } from '../hooks/useAwbExcelGenerator';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { buildAwbHtml } from '../templates/awbPdfTemplate';
import { STRINGS } from '../constants/strings';

export default function AwbCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const shipmentId = searchParams.get('shipmentId');

  const draftKey = editId ? `awb_${editId}` : 'awb_new';

  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [lastSavedDraft, setLastSavedDraft] = useState<string | null>(null);
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  const [availableShipments, setAvailableShipments] = useState<Shipment[]>([]);

  const { exportAwbToExcel, isExporting } = useAwbExcelGenerator();
  const { printHtml } = usePdfGenerator();

  // STEPPER: 4 Pasos Intuitivos
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() =>
    editId ? new Set([1, 2, 3, 4]) : new Set([1])
  );

  useEffect(() => {
    setVisitedSteps((prev) => {
      if (prev.has(currentStep)) return prev;
      const next = new Set(prev);
      next.add(currentStep);
      return next;
    });
  }, [currentStep]);

  const stepTitles = [
    { num: 1, title: STRINGS.awb.step1Title, desc: STRINGS.awb.step1Desc },
    { num: 2, title: STRINGS.awb.step2Title, desc: STRINGS.awb.step2Desc },
    { num: 3, title: STRINGS.awb.step3Title, desc: STRINGS.awb.step3Desc },
    { num: 4, title: STRINGS.awb.step4Title, desc: STRINGS.awb.step4Desc },
  ];

  // FORM FIELDS
  const [id, setId] = useState<string>(editId || '');
  const [doNumber, setDoNumber] = useState('');
  const [airlineCode, setAirlineCode] = useState('');
  const [awbNumber, setAwbNumber] = useState('');
  const [airlineName, setAirlineName] = useState('');
  const [status, setStatus] = useState<'borrador' | 'emitida' | 'anulada'>('emitida');
  const [selectedCopy, setSelectedCopy] = useState<string>('');

  // 2. Shipper (Remitente Master)
  const [shipperName, setShipperName] = useState('');
  const [shipperNit, setShipperNit] = useState('');
  const [shipperAddress, setShipperAddress] = useState('');
  const [shipperPhone, setShipperPhone] = useState('');
  const [shipperCityCountry, setShipperCityCountry] = useState('');
  const [shipperEmail, setShipperEmail] = useState('');
  const [shipperAccountNo, setShipperAccountNo] = useState('');

  // 3. Consignee (Destinatario Master)
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeTaxId, setConsigneeTaxId] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [consigneePhone, setConsigneePhone] = useState('');
  const [consigneeCityCountry, setConsigneeCityCountry] = useState('');
  const [consigneeEmail, setConsigneeEmail] = useState('');
  const [consigneeAccountNo, setConsigneeAccountNo] = useState('');

  // 4. Agent (Transportista Emisor)
  const [agentName, setAgentName] = useState('');
  const [agentNit, setAgentNit] = useState('');
  const [agentCityCountry, setAgentCityCountry] = useState('');
  const [agentIataCode, setAgentIataCode] = useState('');
  const [agentAccountNo, setAgentAccountNo] = useState('');

  // 5-8. Routing & Flight
  const [originCity, setOriginCity] = useState('');
  const [originAirportCode, setOriginAirportCode] = useState('');
  const [destAirportCode, setDestAirportCode] = useState('');
  const [firstCarrierAcronym, setFirstCarrierAcronym] = useState('');
  const [to2nd, setTo2nd] = useState('');
  const [by2nd, setBy2nd] = useState('');
  const [to3rd, setTo3rd] = useState('');
  const [by3rd, setBy3rd] = useState('');
  const [destCity, setDestCity] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [flightDate, setFlightDate] = useState(new Date().toISOString().split('T')[0]);

  // 9-15. Conditions & Accounting
  const [currency, setCurrency] = useState('');
  const [chgsCode, setChgsCode] = useState('');
  const [wtValPayment, setWtValPayment] = useState<'PPD' | 'COLL'>('PPD');
  const [otherPayment, setOtherPayment] = useState<'PPD' | 'COLL'>('PPD');
  const [declaredValueCarriage, setDeclaredValueCarriage] = useState('');
  const [declaredValueCustoms, setDeclaredValueCustoms] = useState('');
  const [amountInsurance, setAmountInsurance] = useState('');
  const [handlingInformation, setHandlingInformation] = useState('');
  const [trm, setTrm] = useState<number>();
  const [accountingInfo, setAccountingInfo] = useState('');

  // 16. Cargo & Rating (Master)
  const [pieces, setPieces] = useState<number>();
  const [grossWeight, setGrossWeight] = useState<number>();
  const [weightUnit, setWeightUnit] = useState<'k' | 'lb'>('k');
  const [rateClass, setRateClass] = useState('');
  const [commodityItemNo, setCommodityItemNo] = useState('');
  const [rateChargeType, setRateChargeType] = useState<any>('');
  const [rateChargeValue, setRateChargeValue] = useState<number>(0);
  const [natureAndQuantity, setNatureAndQuantity] = useState('');

  // Volumetric dimensions calculator (cm)
  const [lengthCm, setLengthCm] = useState<number>(0);
  const [widthCm, setWidthCm] = useState<number>(0);
  const [heightCm, setHeightCm] = useState<number>(0);

  // 17-18. Other Charges & Totals
  const [otherChargesLine1, setOtherChargesLine1] = useState('');
  const [otherChargesLine2, setOtherChargesLine2] = useState('');
  const [otherChargesLine3, setOtherChargesLine3] = useState('');
  const [dueCarrierPrepaid, setDueCarrierPrepaid] = useState<number>(0);
  const [dueCarrierCollect, setDueCarrierCollect] = useState<number>(0);
  const [dueAgentPrepaid, setDueAgentPrepaid] = useState<number>(0);
  const [dueAgentCollect, setDueAgentCollect] = useState<number>(0);
  const [valuationChargePrepaid, setValuationChargePrepaid] = useState<number>(0);
  const [valuationChargeCollect, setValuationChargeCollect] = useState<number>(0);
  const [taxPrepaid, setTaxPrepaid] = useState<number>(0);
  const [taxCollect, setTaxCollect] = useState<number>(0);

  // 19. Signatures
  const [shipperCert, setShipperCert] = useState('');
  const [executedDate, setExecutedDate] = useState(new Date().toISOString().split('T')[0]);
  const [executedPlace, setExecutedPlace] = useState('');
  const [carrierSignature, setCarrierSignature] = useState('');

  // Guías Hijas (HAWBs)
  const [hawbs, setHawbs] = useState<HouseAwb[]>([]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CÁLCULOS AUTOMÁTICOS LEGALES & IATA
  // ─────────────────────────────────────────────────────────────────────────────
  const computedVolumetricWeight = useMemo(() => {
    if (lengthCm > 0 && widthCm > 0 && heightCm > 0) {
      const vol = (lengthCm * widthCm * heightCm) / 6000;
      return Math.round(vol * 10) / 10;
    }
    return 0;
  }, [lengthCm, widthCm, heightCm]);

  const chargeableWeight = useMemo(() => {
    const gw = Number(grossWeight) || 0;
    return Math.max(gw, computedVolumetricWeight);
  }, [grossWeight, computedVolumetricWeight]);

  const computedWeightCharge = useMemo(() => {
    if (rateChargeType === 'as_agreed') return 0;
    const rate = Number(rateChargeValue) || 0;
    return Math.round(chargeableWeight * rate * 100) / 100;
  }, [rateChargeType, rateChargeValue, chargeableWeight]);

  const computedTotalPrepaid = useMemo(() => {
    if (rateChargeType === 'as_agreed') return 0;
    const wc = wtValPayment === 'PPD' ? computedWeightCharge : 0;
    const carrier = Number(dueCarrierPrepaid) || 0;
    const agent = Number(dueAgentPrepaid) || 0;
    const val = Number(valuationChargePrepaid) || 0;
    const tax = Number(taxPrepaid) || 0;
    return Math.round((wc + carrier + agent + val + tax) * 100) / 100;
  }, [rateChargeType, wtValPayment, computedWeightCharge, dueCarrierPrepaid, dueAgentPrepaid, valuationChargePrepaid, taxPrepaid]);

  const computedTotalCollect = useMemo(() => {
    if (rateChargeType === 'as_agreed') return 0;
    const wc = wtValPayment === 'COLL' ? computedWeightCharge : 0;
    const carrier = Number(dueCarrierCollect) || 0;
    const agent = Number(dueAgentCollect) || 0;
    const val = Number(valuationChargeCollect) || 0;
    const tax = Number(taxCollect) || 0;
    return Math.round((wc + carrier + agent + val + tax) * 100) / 100;
  }, [rateChargeType, wtValPayment, computedWeightCharge, dueCarrierCollect, dueAgentCollect, valuationChargeCollect, taxCollect]);

  const handleCalcFs = (ratePerKg: number) => {
    const fs = Math.round(chargeableWeight * ratePerKg * 100) / 100;
    setDueCarrierPrepaid(fs);
    setOtherChargesLine1(`FS: ${ratePerKg} X KILO`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // CONSTRUCCIÓN DEL OBJETO ACTUAL
  // ─────────────────────────────────────────────────────────────────────────────
  const getCurrentAwbObject = useCallback((): AirWaybill => {
    const code = airlineCode.trim();
    const num = awbNumber.trim();
    const full = `${code}-${num}`;

    return {
      id: id || `awb-${Date.now()}`,
      do_number: doNumber,
      airline_code: code,
      awb_number: num,
      full_awb_number: full,
      airline_name: airlineName,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      shipper_name: shipperName,
      shipper_nit: shipperNit,
      shipper_address: shipperAddress,
      shipper_phone: shipperPhone,
      shipper_city_country: shipperCityCountry,
      shipper_email: shipperEmail,
      shipper_account_no: shipperAccountNo,

      consignee_name: consigneeName,
      consignee_tax_id: consigneeTaxId,
      consignee_address: consigneeAddress,
      consignee_phone: consigneePhone,
      consignee_city_country: consigneeCityCountry,
      consignee_email: consigneeEmail,
      consignee_account_no: consigneeAccountNo,

      agent_name: agentName,
      agent_nit: agentNit,
      agent_city_country: agentCityCountry,
      agent_iata_code: agentIataCode,
      agent_account_no: agentAccountNo,

      origin_city: originCity,
      origin_airport_code: originAirportCode.toUpperCase(),
      dest_airport_code: destAirportCode.toUpperCase(),
      first_carrier_acronym: firstCarrierAcronym,
      to_2nd: to2nd,
      by_2nd: by2nd,
      to_3rd: to3rd,
      by_3rd: by3rd,
      dest_city: destCity,
      flight_number: flightNumber,
      flight_date: flightDate,

      currency,
      chgs_code: chgsCode,
      wt_val_payment: wtValPayment,
      other_payment: otherPayment,
      declared_value_carriage: declaredValueCarriage,
      declared_value_customs: declaredValueCustoms,
      amount_insurance: amountInsurance,
      handling_information: handlingInformation,
      trm,
      accounting_information: accountingInfo,

      cargo: {
        pieces: Number(pieces) || 1,
        gross_weight: Number(grossWeight) || 0,
        weight_unit: weightUnit,
        length_cm: lengthCm || undefined,
        width_cm: widthCm || undefined,
        height_cm: heightCm || undefined,
        volumetric_weight: computedVolumetricWeight || undefined,
        chargeable_weight: chargeableWeight,
        rate_class: rateClass,
        commodity_item_no: commodityItemNo,
        rate_charge_type: rateChargeType,
        rate_charge_value: rateChargeType === 'numeric' ? rateChargeValue : undefined,
        rate_charge_display: rateChargeType === 'as_agreed' ? 'AS AGREED' : String(rateChargeValue),
        total_charge_display: rateChargeType === 'as_agreed' ? 'AS AGREED' : computedWeightCharge.toFixed(2),
        nature_and_quantity: natureAndQuantity,
      },

      other_charges_line1: otherChargesLine1,
      other_charges_line2: otherChargesLine2,
      other_charges_line3: otherChargesLine3,
      due_agent_prepaid: Number(dueAgentPrepaid) || 0,
      due_agent_collect: Number(dueAgentCollect) || 0,
      due_carrier_prepaid: Number(dueCarrierPrepaid) || 0,
      due_carrier_collect: Number(dueCarrierCollect) || 0,
      valuation_charge_prepaid: Number(valuationChargePrepaid) || 0,
      valuation_charge_collect: Number(valuationChargeCollect) || 0,
      tax_prepaid: Number(taxPrepaid) || 0,
      tax_collect: Number(taxCollect) || 0,
      total_prepaid: computedTotalPrepaid,
      total_collect: computedTotalCollect,

      shipper_certification: shipperCert,
      executed_date: executedDate,
      executed_place: executedPlace,
      carrier_signature: carrierSignature,

      hawbs,
    };
  }, [
    id, doNumber, airlineCode, awbNumber, airlineName, status,
    shipperName, shipperNit, shipperAddress, shipperPhone, shipperCityCountry, shipperEmail, shipperAccountNo,
    consigneeName, consigneeTaxId, consigneeAddress, consigneePhone, consigneeCityCountry, consigneeEmail, consigneeAccountNo,
    agentName, agentNit, agentCityCountry, agentIataCode, agentAccountNo,
    originCity, originAirportCode, destAirportCode, firstCarrierAcronym, to2nd, by2nd, to3rd, by3rd, destCity, flightNumber, flightDate,
    currency, chgsCode, wtValPayment, otherPayment, declaredValueCarriage, declaredValueCustoms, amountInsurance, handlingInformation, trm, accountingInfo,
    pieces, grossWeight, weightUnit, lengthCm, widthCm, heightCm, computedVolumetricWeight, chargeableWeight, rateClass, commodityItemNo, rateChargeType, rateChargeValue, computedWeightCharge, natureAndQuantity,
    otherChargesLine1, otherChargesLine2, otherChargesLine3, dueAgentPrepaid, dueAgentCollect, dueCarrierPrepaid, dueCarrierCollect, valuationChargePrepaid, valuationChargeCollect, taxPrepaid, taxCollect, computedTotalPrepaid, computedTotalCollect,
    shipperCert, executedDate, executedPlace, carrierSignature, hawbs,
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTO-SAVE DRAFT (Evitar que se pierda la información si sale del formulario)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Si ya tiene número de guía o algún dato relevante, auto-guardar cada 2 segundos
    const timer = setTimeout(() => {
      const current = getCurrentAwbObject();
      DraftStorage.saveDraft(draftKey, current);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedDraft(timeStr);
    }, 1500);

    return () => clearTimeout(timer);
  }, [getCurrentAwbObject, draftKey]);

  // Protección ante cierre accidental de pestaña
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (awbNumber.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [awbNumber]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CARGA INICIAL & RECUPERACIÓN DE BORRADOR
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // 1. Cargar terceros
      try {
        const parties = await ThirdPartyService.getThirdParties();
        setThirdParties(parties);
      } catch (err) {
        console.error('Error cargando terceros:', err);
      }

      // 2. Cargar operaciones aéreas activas de tráfico para autollenado rápido
      try {
        const { data: ships } = await supabase
          .from('shipments')
          .select('id, do_number, origin, destination, carrier, exporter, consignee, air_waybill')
          .eq('shipment_type', 'air')
          .order('created_at', { ascending: false })
          .limit(20);
        if (ships) setAvailableShipments(ships as unknown as Shipment[]);
      } catch (err) {
        console.error('Error cargando tráficos:', err);
      }

      // 3. Revisar si hay un borrador guardado en localStorage
      const draft = DraftStorage.getDraft<AirWaybill>(draftKey);
      if (draft && !editId && !shipmentId) {
        applyAwbData(draft.data);
        const savedDate = new Date(draft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setDraftNotice(`Se recuperó un borrador guardado automáticamente a las ${savedDate}.`);
        return;
      }

      // 4. Edición de AWB existente
      if (editId) {
        const existing = await AwbService.getAwbById(editId);
        if (existing) {
          applyAwbData(existing);
          return;
        }
      }

      // 5. Prellenado desde tráfico
      if (shipmentId) {
        try {
          const { data: ship } = await supabase
            .from('shipments')
            .select('id, do_number, origin, destination, carrier, exporter, consignee, air_waybill')
            .eq('id', shipmentId)
            .single();

          if (ship) {
            handleApplyShipment(ship as unknown as Shipment);
          }
        } catch (err) {
          console.error('Error prellenando desde tráfico:', err);
        }
      }
    };

    init();
  }, [editId, shipmentId, draftKey]);

  const applyAwbData = (data: AirWaybill) => {
    setId(data.id || '');
    setDoNumber(data.do_number || '');
    setAirlineCode(data.airline_code || '729');
    setAwbNumber(data.awb_number || '');
    setAirlineName(data.airline_name || 'Tampa Cargo S.A.S');
    setStatus(data.status || 'emitida');

    setShipperName(data.shipper_name || 'INGELOX S.A.S.');
    setShipperNit(data.shipper_nit || '900.526.917-1');
    setShipperAddress(data.shipper_address || '');
    setShipperPhone(data.shipper_phone || '');
    setShipperCityCountry(data.shipper_city_country || '');
    setShipperEmail(data.shipper_email || '');
    setShipperAccountNo(data.shipper_account_no || '');

    setConsigneeName(data.consignee_name || '');
    setConsigneeTaxId(data.consignee_tax_id || '');
    setConsigneeAddress(data.consignee_address || '');
    setConsigneePhone(data.consignee_phone || '');
    setConsigneeCityCountry(data.consignee_city_country || '');
    setConsigneeEmail(data.consignee_email || '');
    setConsigneeAccountNo(data.consignee_account_no || '');

    setAgentName(data.agent_name || 'INGELOX S.A.S.');
    setAgentNit(data.agent_nit || '900.526.917-1');
    setAgentCityCountry(data.agent_city_country || 'Bogotá, Colombia');
    setAgentIataCode(data.agent_iata_code || '76-1 0215/0003');
    setAgentAccountNo(data.agent_account_no || '');

    setOriginCity(data.origin_city || 'Bogota - Colombia');
    setOriginAirportCode(data.origin_airport_code || 'BOG');
    setDestAirportCode(data.dest_airport_code || 'MEX');
    setFirstCarrierAcronym(data.first_carrier_acronym || '');
    setTo2nd(data.to_2nd || '');
    setBy2nd(data.by_2nd || '');
    setTo3rd(data.to_3rd || '');
    setBy3rd(data.by_3rd || '');
    setDestCity(data.dest_city || '');
    setFlightNumber(data.flight_number || '');
    setFlightDate(data.flight_date || '');

    setCurrency(data.currency || 'USD');
    setChgsCode(data.chgs_code || '');
    setWtValPayment(data.wt_val_payment || 'PPD');
    setOtherPayment(data.other_payment || 'PPD');
    setDeclaredValueCarriage(data.declared_value_carriage || 'N.V.D.');
    setDeclaredValueCustoms(data.declared_value_customs || 'N.C.V.');
    setAmountInsurance(data.amount_insurance || 'N.I.L.');
    setHandlingInformation(data.handling_information || 'ATTACHED DOCUMENTS');
    setTrm(data.trm || 3208.66);
    setAccountingInfo(data.accounting_information || '');

    if (data.cargo) {
      setPieces(data.cargo.pieces || 1);
      setGrossWeight(data.cargo.gross_weight || 0);
      setWeightUnit(data.cargo.weight_unit || 'k');
      setLengthCm(data.cargo.length_cm || 0);
      setWidthCm(data.cargo.width_cm || 0);
      setHeightCm(data.cargo.height_cm || 0);
      setRateClass(data.cargo.rate_class || 'Q');
      setCommodityItemNo(data.cargo.commodity_item_no || '');
      setRateChargeType(data.cargo.rate_charge_type || 'numeric');
      setRateChargeValue(data.cargo.rate_charge_value || 0.90);
      setNatureAndQuantity(data.cargo.nature_and_quantity || '');
    }

    setOtherChargesLine1(data.other_charges_line1 || '');
    setOtherChargesLine2(data.other_charges_line2 || '');
    setOtherChargesLine3(data.other_charges_line3 || '');
    setDueCarrierPrepaid(data.due_carrier_prepaid || 0);
    setDueCarrierCollect(data.due_carrier_collect || 0);
    setDueAgentPrepaid(data.due_agent_prepaid || 0);
    setDueAgentCollect(data.due_agent_collect || 0);
    setValuationChargePrepaid(data.valuation_charge_prepaid || 0);
    setValuationChargeCollect(data.valuation_charge_collect || 0);
    setTaxPrepaid(data.tax_prepaid || 0);
    setTaxCollect(data.tax_collect || 0);

    setShipperCert(data.shipper_certification || '');
    setExecutedDate(data.executed_date || '');
    setExecutedPlace(data.executed_place || 'Bogota, Colombia');
    setCarrierSignature(data.carrier_signature || 'INGELOX S.A.S.');

    setHawbs(data.hawbs || []);
  };

  const handleApplyShipment = (ship: Shipment) => {
    setDoNumber(ship.do_number || '');
    if (ship.origin) setOriginCity(ship.origin);
    if (ship.destination) setDestCity(ship.destination);
    if (ship.carrier) {
      setAirlineName(ship.carrier);
      setFirstCarrierAcronym(ship.carrier);
    }
    const anyShip = ship as any;
    if (anyShip.total_weight) setGrossWeight(Number(anyShip.total_weight));
    if (anyShip.total_pieces) setPieces(Number(anyShip.total_pieces));
    if (ship.exporter) setShipperName(ship.exporter);
    if (ship.consignee) setConsigneeName(ship.consignee);
    const awbRef = ship.air_waybill || anyShip.booking_number;
    if (awbRef) {
      const parts = awbRef.split('-');
      if (parts.length === 2) {
        setAirlineCode(parts[0].trim());
        setAwbNumber(parts[1].trim());
      } else {
        setAwbNumber(awbRef.trim());
      }
    }
    setFeedbackMsg({ type: 'success', text: `Datos precargados desde la operación de tráfico DO ${ship.do_number}.` });
  };

  const handleDiscardDraft = () => {
    DraftStorage.clearDraft(draftKey);
    setDraftNotice(null);
    window.location.reload();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MANEJO DE PASOS (STEPPER & ESTADO INTERMEDIO ESTÉTICO)
  // ─────────────────────────────────────────────────────────────────────────────
  const isStepComplete = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return Boolean(
            awbNumber.trim() &&
            airlineCode.trim() &&
            airlineName.trim() &&
            shipperName.trim() &&
            consigneeName.trim() &&
            agentName.trim()
          );
        case 2:
          return Boolean(
            originAirportCode.trim() &&
            destAirportCode.trim() &&
            currency.trim() &&
            flightNumber.trim() &&
            flightDate.trim()
          );
        case 3:
          return Boolean(
            Number(pieces) > 0 &&
            Number(grossWeight) > 0 &&
            Number(chargeableWeight) > 0 &&
            natureAndQuantity.trim() &&
            (rateChargeType === 'as_agreed' || Number(rateChargeValue) > 0)
          );
        case 4:
          return Boolean(
            carrierSignature.trim() &&
            executedDate.trim() &&
            executedPlace.trim() &&
            (hawbs.length === 0 ||
              hawbs.every(
                (h) =>
                  Boolean(h.hawb_number?.trim()) &&
                  Boolean(h.shipper_name?.trim()) &&
                  Boolean(h.consignee_name?.trim()) &&
                  (Number(h.gross_weight) || 0) > 0 &&
                  (Number(h.pieces) || 0) > 0
              ))
          );
        default:
          return false;
      }
    },
    [
      awbNumber,
      airlineCode,
      airlineName,
      shipperName,
      consigneeName,
      agentName,
      originAirportCode,
      destAirportCode,
      currency,
      flightNumber,
      flightDate,
      pieces,
      grossWeight,
      chargeableWeight,
      natureAndQuantity,
      rateChargeType,
      rateChargeValue,
      carrierSignature,
      executedDate,
      executedPlace,
      hawbs,
    ]
  );

  const getStepState = useCallback(
    (stepNum: number): 'selected' | 'completed' | 'intermediate' | 'unvisited' => {
      if (currentStep === stepNum) return 'selected';
      if (isStepComplete(stepNum)) return 'completed';
      if (visitedSteps.has(stepNum) || currentStep > stepNum) return 'intermediate';
      return 'unvisited';
    },
    [currentStep, isStepComplete, visitedSteps]
  );

  const handleNextStep = () => {
    setFeedbackMsg(null);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => {
    setFeedbackMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // GUARDAR & EXPORTAR
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!awbNumber.trim()) {
      setFeedbackMsg({ type: 'error', text: 'El número de guía aérea es obligatorio' });
      setCurrentStep(1);
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);

    try {
      const current = getCurrentAwbObject();
      const saved = await AwbService.saveAwb(current);
      setId(saved.id);
      DraftStorage.clearDraft(draftKey);
      setDraftNotice(null);
      setFeedbackMsg({ type: 'success', text: `Guía aérea ${saved.full_awb_number} guardada y emitida exitosamente.` });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Error al guardar: ${err.message || 'Error desconocido'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = () => {
    const current = getCurrentAwbObject();
    exportAwbToExcel(current, selectedCopy);
  };

  const handlePrintPdf = () => {
    const current = getCurrentAwbObject();
    const html = buildAwbHtml(current, null, selectedCopy);
    const title = selectedCopy === 'all'
      ? `AWB_${current.full_awb_number}_JUEGO_COMPLETO`
      : `AWB_${current.full_awb_number}`;
    printHtml(html, { title, orientation: 'portrait' });
  };

  // Guías Hijas helpers
  const handleAddHawb = () => {
    const nextNum = hawbs.length + 1;
    const newHawb: HouseAwb = {
      id: `hawb-${Date.now()}`,
      hawb_number: `H-${nextNum}`,
      shipper_name: '',
      shipper_nit: '',
      shipper_address: '',
      shipper_phone: '',
      shipper_city_country: '',
      consignee_name: '',
      consignee_tax_id: '',
      consignee_address: '',
      consignee_phone: '',
      consignee_city_country: '',
      handling_information: 'ATTACHED DOCUMENTS',
      pieces: 1,
      gross_weight: 1,
      weight_unit: 'k',
      chargeable_weight: 1,
      rate_charge_display: 'AS AGREED',
      total_charge_display: 'AS AGREED',
      nature_and_quantity: 'GENERAL CARGO',
      weight_charge_display: 'AS AGREED',
      total_charges_display: 'AS AGREED',
    };
    setHawbs([...hawbs, newHawb]);
  };

  const handleRemoveHawb = (hawbId: string) => {
    setHawbs(hawbs.filter((h) => h.id !== hawbId));
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/awb')}
            className="erp-btn-secondary p-2"
            aria-label="Volver a lista de guías"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="erp-page-title">
              {editId ? `Editar Guía Aérea ${airlineCode}-${awbNumber}` : `Nueva Guía Aérea`}
            </h1>
            <p className="erp-page-subtitle">
              Generación de Guía Master y Guías Hijas bajo el formato oficial y estándares IATA.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status selector */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="erp-select text-xs py-1.5 px-3 w-auto font-bold"
          >
            <option value="borrador">Borrador</option>
            <option value="emitida">Emitida</option>
            <option value="anulada">Anulada</option>
          </select>

          {/* Copy Selector */}
          <select
            value={selectedCopy}
            onChange={(e) => setSelectedCopy(e.target.value)}
            className="erp-select text-xs py-1.5 px-2.5 w-auto font-semibold cursor-pointer"
            title="Seleccionar copia para PDF o Excel"
          >
            <option value="ORIGINAL 1 (FOR ISSUING CARRIER)">{STRINGS.awb.copyOriginal1}</option>
            <option value="ORIGINAL 2 (FOR CONSIGNEE/RECEIVER)">{STRINGS.awb.copyOriginal2}</option>
            <option value="ORIGINAL 3 (FOR SHIPPER)">{STRINGS.awb.copyOriginal3}</option>
            <option value="ORIGINAL 4 (A DELIVERY RECEIPT)">{STRINGS.awb.copyOriginal4}</option>
            <option value="COPY 5 (FOR VARIOUS PROPOUSE)">{STRINGS.awb.copy5}</option>
            <option value="COPY 6 (FOR VARIOUS PROPOUSE)">{STRINGS.awb.copy6}</option>
            <option value="COPY 7 (FOR VARIOUS PROPOUSE)">{STRINGS.awb.copy7}</option>
            <option value="COPY 8 (FOR VARIOUS PROPOUSE)">{STRINGS.awb.copy8}</option>
            <option value="all">{STRINGS.awb.copyAll}</option>
          </select>

          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="erp-btn-secondary text-xs"
            title="Exportar Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Excel Oficial</span>
          </button>

          {/* Imprimir PDF */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="erp-btn-secondary text-xs"
            title="Imprimir formato IATA"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-500" />
            <span>Imprimir PDF</span>
          </button>

          {/* Guardar directo */}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="erp-btn-primary text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Guardando...' : 'Guardar Guía'}</span>
          </button>
        </div>
      </div>

      {/* DRAFT ALERT / AUTO-SAVE INDICATOR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-xl border bg-surface-raised text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-muted">
            {lastSavedDraft
              ? `Autoguardado activo: borrador guardado a las ${lastSavedDraft}`
              : 'Autoguardado activo (no perderás tus datos al salir)'}
          </span>
        </div>

        {draftNotice ? (
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 font-semibold">{draftNotice}</span>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="text-rose-500 underline text-[11px] font-bold ml-2"
            >
              Descartar borrador
            </button>
          </div>
        ) : (
          availableShipments.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff6600]" />
              <select
                onChange={(e) => {
                  const ship = availableShipments.find((s) => s.id === e.target.value);
                  if (ship) handleApplyShipment(ship);
                }}
                className="erp-select text-[11px] py-1 px-2 w-auto max-w-[210px]"
                defaultValue=""
              >
                <option value="" disabled>Autollenar desde Tráfico...</option>
                {availableShipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    DO: {s.do_number} — {s.carrier || 'Aéreo'}
                  </option>
                ))}
              </select>
            </div>
          )
        )}
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 text-xs font-semibold ${
            feedbackMsg.type === 'error' ? 'erp-badge-danger w-full justify-start' : 'erp-badge-emerald w-full justify-start'
          }`}
        >
          {feedbackMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* STEPPER INTUITIVO & BARRA DE PROGRESO */}
      <div className="erp-card p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {stepTitles.map((st) => {
            const state = getStepState(st.num);
            const isComplete = isStepComplete(st.num);

            let containerStyle = '';
            let badgeStyle = '';
            let badgeIcon: React.ReactNode = st.num;
            let statusPill: React.ReactNode = null;

            if (state === 'selected') {
              containerStyle = 'border-[#ff6600] bg-[rgba(255,102,0,0.06)] ring-1 ring-[#ff6600] shadow-sm';
              badgeStyle = 'bg-[#ff6600] text-white shadow-sm';
              badgeIcon = st.num;
              statusPill = isComplete ? (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {STRINGS.awb.stepStatusReady}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-[#ff6600]">
                  {STRINGS.awb.stepStatusEditing}
                </span>
              );
            } else if (state === 'completed') {
              containerStyle = 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/70 transition-all';
              badgeStyle = 'bg-emerald-500 text-white shadow-sm';
              badgeIcon = '✓';
              statusPill = (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ {STRINGS.awb.stepStatusComplete}
                </span>
              );
            } else if (state === 'intermediate') {
              containerStyle = 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70 transition-all';
              badgeStyle = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold';
              badgeIcon = st.num;
              statusPill = (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  ● {STRINGS.awb.stepStatusIncomplete}
                </span>
              );
            } else {
              containerStyle = 'border-border-default opacity-60 hover:opacity-100 bg-surface-raised transition-all';
              badgeStyle = 'bg-surface-raised text-muted border border-border-default';
              badgeIcon = st.num;
              statusPill = (
                <span className="text-[10px] text-muted">
                  {STRINGS.awb.stepStatusPending}
                </span>
              );
            }

            return (
              <button
                key={st.num}
                type="button"
                onClick={() => setCurrentStep(st.num)}
                className={`p-3 rounded-xl border text-left transition-all ${containerStyle}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${badgeStyle}`}
                    >
                      {badgeIcon}
                    </span>
                    <span className="text-xs font-bold">Paso {st.num}</span>
                  </div>
                  {statusPill}
                </div>
                <div className="font-semibold text-xs truncate">{st.title}</div>
                <div className="text-[10px] text-muted truncate">{st.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface-raised h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#ff6600] h-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* FORM BODY */}
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        {/* ========================================================================= */}
        {/* PASO 1: IDENTIFICACIÓN & PARTES (GUÍA MASTER)                             */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            {/* 1. Número de Guía Aérea */}
            <div className="erp-card p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6600] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#ff6600] text-white flex items-center justify-center text-[11px]">1</span>
                Número de Guía Aérea (Master)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-3">
                  <label className="erp-label">IATA CODE Transportador</label>
                  <input
                    type="text"
                    value={airlineCode}
                    onChange={(e) => setAirlineCode(e.target.value)}
                    placeholder="729"
                    maxLength={3}
                    required
                    className="erp-input font-mono font-bold"
                  />
                  <span className="text-[10px] text-muted">Prefijo de 3 dígitos (Ej: 729)</span>
                </div>

                <div className="sm:col-span-4">
                  <label className="erp-label">Guía Aérea (Serial 8 dígitos)</label>
                  <input
                    type="text"
                    value={awbNumber}
                    onChange={(e) => setAwbNumber(e.target.value)}
                    placeholder="45241232"
                    required
                    className="erp-input font-mono font-bold text-sm"
                  />
                  <span className="text-[10px] text-muted">Consecutivo otorgado por la aerolínea</span>
                </div>

                <div className="sm:col-span-5">
                  <label className="erp-label">Aerolínea</label>
                  <input
                    type="text"
                    value={airlineName}
                    onChange={(e) => setAirlineName(e.target.value)}
                    placeholder="Tampa Cargo S.A.S"
                    required
                    className="erp-input"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="erp-label">DO de Tráfico Operativo</label>
                  <input
                    type="text"
                    value={doNumber}
                    onChange={(e) => setDoNumber(e.target.value)}
                    placeholder="EXP-26042"
                    className="erp-input font-mono"
                  />
                </div>

                <div className="sm:col-span-8 flex items-center p-3 rounded-lg bg-surface-raised border mt-auto" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <span className="text-[10px] font-bold text-muted block uppercase">Documento Maestro AWB</span>
                    <span className="font-mono text-base font-bold text-[#ff6600]">
                      {airlineCode || '---'} - {awbNumber || '--------'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 2. Información del Remitente */}
              <div className="erp-card p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6600] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ff6600] text-white flex items-center justify-center text-[11px]">2</span>
                    Información del Remitente (Shipper)
                  </h3>
                  {thirdParties.length > 0 && (
                    <select
                      onChange={(e) => {
                        const p = thirdParties.find((t) => t.id === e.target.value);
                        if (p) {
                          setShipperName(p.razon_social);
                          setShipperNit(p.identificacion + (p.dv ? `-${p.dv}` : ''));
                          setShipperAddress(p.direccion);
                          setShipperPhone(p.telefono);
                          setShipperCityCountry(`${p.ciudad}, ${p.pais}`);
                          setShipperEmail(p.email || '');
                        }
                      }}
                      className="erp-select text-[11px] py-1 px-2 w-auto max-w-[160px]"
                      defaultValue=""
                    >
                      <option value="" disabled>Autollenar Tercero...</option>
                      {thirdParties.map((tp) => (
                        <option key={tp.id} value={tp.id}>{tp.razon_social}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="erp-label">Nombre</label>
                  <input
                    type="text"
                    value={shipperName}
                    onChange={(e) => setShipperName(e.target.value)}
                    required
                    className="erp-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="erp-label">N.I.T. / Documento</label>
                    <input
                      type="text"
                      value={shipperNit}
                      onChange={(e) => setShipperNit(e.target.value)}
                      className="erp-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Teléfono</label>
                    <input
                      type="text"
                      value={shipperPhone}
                      onChange={(e) => setShipperPhone(e.target.value)}
                      className="erp-input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="erp-label">Dirección</label>
                  <input
                    type="text"
                    value={shipperAddress}
                    onChange={(e) => setShipperAddress(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="erp-label">Ciudad País</label>
                    <input
                      type="text"
                      value={shipperCityCountry}
                      onChange={(e) => setShipperCityCountry(e.target.value)}
                      className="erp-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Correo Electrónico</label>
                    <input
                      type="email"
                      value={shipperEmail}
                      onChange={(e) => setShipperEmail(e.target.value)}
                      className="erp-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Información del Consignatario */}
              <div className="erp-card p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6600] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ff6600] text-white flex items-center justify-center text-[11px]">3</span>
                    Información del Consignatario (Consignee)
                  </h3>
                  {thirdParties.length > 0 && (
                    <select
                      onChange={(e) => {
                        const p = thirdParties.find((t) => t.id === e.target.value);
                        if (p) {
                          setConsigneeName(p.razon_social);
                          setConsigneeTaxId(p.identificacion);
                          setConsigneeAddress(p.direccion);
                          setConsigneePhone(p.telefono);
                          setConsigneeCityCountry(`${p.ciudad}, ${p.pais}`);
                          setConsigneeEmail(p.email || '');
                        }
                      }}
                      className="erp-select text-[11px] py-1 px-2 w-auto max-w-[160px]"
                      defaultValue=""
                    >
                      <option value="" disabled>Autollenar Tercero...</option>
                      {thirdParties.map((tp) => (
                        <option key={tp.id} value={tp.id}>{tp.razon_social}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="erp-label">Nombre</label>
                  <input
                    type="text"
                    value={consigneeName}
                    onChange={(e) => setConsigneeName(e.target.value)}
                    placeholder="LINK GL SA DE CV"
                    required
                    className="erp-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="erp-label">R.F.C. / Tax ID</label>
                    <input
                      type="text"
                      value={consigneeTaxId}
                      onChange={(e) => setConsigneeTaxId(e.target.value)}
                      className="erp-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Teléfono</label>
                    <input
                      type="text"
                      value={consigneePhone}
                      onChange={(e) => setConsigneePhone(e.target.value)}
                      className="erp-input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="erp-label">Dirección</label>
                  <input
                    type="text"
                    value={consigneeAddress}
                    onChange={(e) => setConsigneeAddress(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="erp-label">Ciudad País</label>
                    <input
                      type="text"
                      value={consigneeCityCountry}
                      onChange={(e) => setConsigneeCityCountry(e.target.value)}
                      className="erp-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Correo Electrónico</label>
                    <input
                      type="email"
                      value={consigneeEmail}
                      onChange={(e) => setConsigneeEmail(e.target.value)}
                      className="erp-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Información de Transportador / Agente */}
              <div className="erp-card p-5 space-y-3 md:col-span-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6600] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ff6600] text-white flex items-center justify-center text-[11px]">4</span>
                  Información del Transportador / Agente Emisor (Issuing Carrier's Agent)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="erp-label">Nombre</label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="erp-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="erp-label">NIT</label>
                    <input
                      type="text"
                      value={agentNit}
                      onChange={(e) => setAgentNit(e.target.value)}
                      className="erp-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="erp-label">IATA CODE Transportador</label>
                    <input
                      type="text"
                      value={agentIataCode}
                      onChange={(e) => setAgentIataCode(e.target.value)}
                      className="erp-input text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Ciudad País</label>
                    <input
                      type="text"
                      value={agentCityCountry}
                      onChange={(e) => setAgentCityCountry(e.target.value)}
                      className="erp-input text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: RUTA, VUELOS & CONDICIONES IATA                                   */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            {/* 5-8. Rutas y Vuelos */}
            <div className="erp-card p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6600]">
                5, 6, 7 y 8. Aeropuertos, Encaminamiento y Vuelo Solicitado
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-4">
                  <label className="erp-label">5. Ciudad de Origen</label>
                  <input
                    type="text"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="erp-label">Código Aeropuerto</label>
                  <input
                    type="text"
                    value={originAirportCode}
                    onChange={(e) => setOriginAirportCode(e.target.value)}
                    maxLength={3}
                    className="erp-input font-mono font-bold text-center"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="erp-label">6. Destino (Código)</label>
                  <input
                    type="text"
                    value={destAirportCode}
                    onChange={(e) => setDestAirportCode(e.target.value)}
                    maxLength={3}
                    className="erp-input font-mono font-bold text-center"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="erp-label">Primer Transportador (Acrónimo)</label>
                  <input
                    type="text"
                    value={firstCarrierAcronym}
                    onChange={(e) => setFirstCarrierAcronym(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="erp-label">8. Ciudad de Destino</label>
                  <input
                    type="text"
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="erp-label">Vuelo Solicitado</label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="AV0072"
                    className="erp-input font-mono font-bold text-xs"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="erp-label">Fecha de Vuelo</label>
                  <input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="erp-label">7. TO (Segundo Aeropuerto)</label>
                  <input
                    type="text"
                    value={to2nd}
                    onChange={(e) => setTo2nd(e.target.value)}
                    placeholder="Opcional"
                    className="erp-input font-mono text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="erp-label">BY (Segundo Transportador)</label>
                  <input
                    type="text"
                    value={by2nd}
                    onChange={(e) => setBy2nd(e.target.value)}
                    placeholder="Opcional"
                    className="erp-input text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="erp-label">TO (Tercer Aeropuerto)</label>
                  <input
                    type="text"
                    value={to3rd}
                    onChange={(e) => setTo3rd(e.target.value)}
                    placeholder="Opcional"
                    className="erp-input font-mono text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="erp-label">BY (Tercer Transportador)</label>
                  <input
                    type="text"
                    value={by3rd}
                    onChange={(e) => setBy3rd(e.target.value)}
                    placeholder="Opcional"
                    className="erp-input text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 9-15. Condiciones, Moneda y Valores Declarados */}
            <div className="erp-card p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6600]">
                9 a 15. Contabilidad, Moneda, Valores Declarados y Manejo
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-3">
                  <label className="erp-label">9. TRM (Tasa de Cambio)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={trm}
                    onChange={(e) => setTrm(parseFloat(e.target.value) || 0)}
                    className="erp-input font-mono text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="erp-label">10. Moneda</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="erp-select text-xs font-bold"
                  >
                    <option value="USD">USD (Dólares)</option>
                    <option value="COP">COP (Pesos Colombianos)</option>
                    <option value="EUR">EUR (Euros)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="erp-label">11. WT/VAL (Flete y Valor)</label>
                  <select
                    value={wtValPayment}
                    onChange={(e) => setWtValPayment(e.target.value as any)}
                    className="erp-select text-xs font-bold"
                  >
                    <option value="PPD">PPD (Prepago)</option>
                    <option value="COLL">COLL (Al Cobro)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="erp-label">Otros Cargos (Payment)</label>
                  <select
                    value={otherPayment}
                    onChange={(e) => setOtherPayment(e.target.value as any)}
                    className="erp-select text-xs font-bold"
                  >
                    <option value="PPD">PPD (Prepago)</option>
                    <option value="COLL">COLL (Al Cobro)</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="erp-label">13. Valor Declarado Transporte</label>
                  <input
                    type="text"
                    value={declaredValueCarriage}
                    onChange={(e) => setDeclaredValueCarriage(e.target.value)}
                    className="erp-input font-mono text-center text-xs"
                  />
                  <span className="text-[10px] text-muted">Ej: N.V.D. (No Value Declared)</span>
                </div>

                <div className="sm:col-span-4">
                  <label className="erp-label">Valor Declarado Aduana</label>
                  <input
                    type="text"
                    value={declaredValueCustoms}
                    onChange={(e) => setDeclaredValueCustoms(e.target.value)}
                    className="erp-input font-mono text-center text-xs"
                  />
                  <span className="text-[10px] text-muted">Ej: N.C.V. (No Commercial Value)</span>
                </div>

                <div className="sm:col-span-4">
                  <label className="erp-label">14. Seguro</label>
                  <input
                    type="text"
                    value={amountInsurance}
                    onChange={(e) => setAmountInsurance(e.target.value)}
                    className="erp-input font-mono text-center text-xs"
                  />
                  <span className="text-[10px] text-muted">Ej: N.I.L.</span>
                </div>

                <div className="sm:col-span-12">
                  <label className="erp-label">15. Información de Manejo</label>
                  <input
                    type="text"
                    value={handlingInformation}
                    onChange={(e) => setHandlingInformation(e.target.value)}
                    className="erp-input text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: MERCANCÍA, TARIFAS & LIQUIDACIÓN (GUÍA MASTER)                     */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            {/* 16. Información de Envío */}
            <div className="erp-card p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6600] flex items-center justify-between">
                <span>16. Información de Envío & Tarifación IATA</span>
                <span className="text-xs font-mono font-bold text-emerald-500">
                  {chargeableWeight} {weightUnit} PESO TARIFADO
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-3">
                  <label className="erp-label">No. of Pieces RCP (Bultos)</label>
                  <input
                    type="number"
                    min="1"
                    value={pieces}
                    onChange={(e) => setPieces(parseInt(e.target.value) || 1)}
                    required
                    className="erp-input font-mono font-bold text-center"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="erp-label">Gross Weight (Peso Bruto)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
                    required
                    className="erp-input font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="erp-label">Kg / lb</label>
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value as any)}
                    className="erp-select font-bold"
                  >
                    <option value="k">k (Kilos)</option>
                    <option value="lb">lb (Libras)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="erp-label">Rate Class</label>
                  <input
                    type="text"
                    value={rateClass}
                    onChange={(e) => setRateClass(e.target.value)}
                    className="erp-input font-mono font-bold text-center uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="erp-label">No. de Artículo</label>
                  <input
                    type="text"
                    value={commodityItemNo}
                    onChange={(e) => setCommodityItemNo(e.target.value)}
                    placeholder="Opcional"
                    className="erp-input font-mono text-xs"
                  />
                </div>

                {/* Calculadora Volumétrica IATA */}
                <div className="sm:col-span-12 p-3.5 rounded-xl border bg-surface-raised space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-[#ff6600]" />
                      Dimensiones para Peso Volumétrico (Fórmula Oficial IATA: L × W × H / 6000)
                    </span>
                    <span className="text-xs text-muted">
                      Volumétrico Calculado: <strong>{computedVolumetricWeight} kg</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-muted font-semibold block">Largo (cm)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={lengthCm || ''}
                        onChange={(e) => setLengthCm(parseFloat(e.target.value) || 0)}
                        className="erp-input text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted font-semibold block">Ancho (cm)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={widthCm || ''}
                        onChange={(e) => setWidthCm(parseFloat(e.target.value) || 0)}
                        className="erp-input text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted font-semibold block">Alto (cm)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={heightCm || ''}
                        onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                        className="erp-input text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarificación */}
                <div className="sm:col-span-4">
                  <label className="erp-label">Modalidad de Rate / Charge</label>
                  <select
                    value={rateChargeType}
                    onChange={(e) => setRateChargeType(e.target.value as any)}
                    className="erp-select text-xs font-bold"
                  >
                    <option value="numeric">Tarifa por Kilo ({currency}/kg)</option>
                    <option value="as_agreed">AS AGREED (Confidencial)</option>
                  </select>
                </div>

                {rateChargeType === 'numeric' && (
                  <div className="sm:col-span-4">
                    <label className="erp-label">Rate / Charge ({currency}/kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rateChargeValue}
                      onChange={(e) => setRateChargeValue(parseFloat(e.target.value) || 0)}
                      className="erp-input font-mono font-bold"
                    />
                  </div>
                )}

                <div className="sm:col-span-4 flex items-center p-3 rounded-lg bg-surface-raised border mt-auto" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <span className="text-[10px] font-bold text-muted block uppercase">Total (Weight Charge)</span>
                    <span className="font-mono text-sm font-bold text-emerald-500">
                      {rateChargeType === 'as_agreed' ? 'AS AGREED' : `${currency} ${computedWeightCharge.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-12">
                  <label className="erp-label">Nature and Quantity of Goods (incl. Dimensions or Volume)</label>
                  <textarea
                    rows={4}
                    value={natureAndQuantity}
                    onChange={(e) => setNatureAndQuantity(e.target.value)}
                    className="erp-input font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 17 y 18. Otros Cargos & Costos */}
            <div className="erp-card p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6600]">
                17 y 18. Otros Cargos & Costos de Liquidación
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6">
                  <div className="flex items-center justify-between">
                    <label className="erp-label">17. Otros Cargos - Línea 1</label>
                    <button
                      type="button"
                      onClick={() => handleCalcFs(0.26)}
                      className="text-[10px] text-[#ff6600] underline font-bold"
                    >
                      Calcular FS (0.26/kg)
                    </button>
                  </div>
                  <input
                    type="text"
                    value={otherChargesLine1}
                    onChange={(e) => setOtherChargesLine1(e.target.value)}
                    placeholder="FS: 0,26 X KILO"
                    className="erp-input text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="erp-label">Total Cargos Transportador (Due Carrier)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dueCarrierPrepaid}
                    onChange={(e) => setDueCarrierPrepaid(parseFloat(e.target.value) || 0)}
                    className="erp-input font-mono text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="erp-label">Total Cargos Agente (Due Agent)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dueAgentPrepaid}
                    onChange={(e) => setDueAgentPrepaid(parseFloat(e.target.value) || 0)}
                    className="erp-input font-mono text-xs"
                  />
                </div>

                {/* 19. Firmas */}
                <div className="sm:col-span-6">
                  <label className="erp-label">19. Lugar de Ejecución (at place)</label>
                  <input
                    type="text"
                    value={executedPlace}
                    onChange={(e) => setExecutedPlace(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="erp-label">Firma Transportador Emisor</label>
                  <input
                    type="text"
                    value={carrierSignature}
                    onChange={(e) => setCarrierSignature(e.target.value)}
                    className="erp-input text-xs font-bold"
                  />
                </div>

                {/* Gran Total */}
                <div className="sm:col-span-12 p-4 rounded-xl bg-surface-raised border flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
                  <div>
                    <span className="text-xs font-bold uppercase text-muted">18. Total Liquidación Master ({currency})</span>
                    <span className="text-xl font-mono font-bold block text-[#ff6600]">
                      {rateChargeType === 'as_agreed' ? 'AS AGREED' : `${currency} ${computedTotalPrepaid.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <span>Modalidad de Cobro: <strong>{wtValPayment === 'PPD' ? 'PREPAGO (PPD)' : 'AL COBRO (COLL)'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 4: GUÍAS HIJAS (CONSOLIDADOS)                                       */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff6600]">
                  Guías Hijas Consolidadas
                </h3>
                <p className="text-xs text-muted">
                  Datos de las guías de cada cliente individual consolidadas bajo esta Guía Master.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddHawb}
                className="erp-btn-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Guía Hija</span>
              </button>
            </div>

            {hawbs.length === 0 ? (
              <div className="erp-card p-8 text-center space-y-2">
                <Layers className="w-8 h-8 mx-auto text-muted opacity-40" />
                <p className="text-xs text-muted font-semibold">
                  No hay Guías Hijas añadidas a esta Guía Master.
                </p>
                <button
                  type="button"
                  onClick={handleAddHawb}
                  className="erp-btn-secondary text-xs mx-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Guía Hija 1</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {hawbs.map((h, idx) => (
                  <div key={h.id} className="erp-card p-5 space-y-4 relative border-l-4 border-l-[#ff6600]">
                    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
                      <span className="text-xs font-mono font-bold text-[#ff6600]">
                        DATOS DE LA GUÍA HIJA {idx + 1} — No. Guía Hija:
                        <input
                          type="text"
                          value={h.hawb_number}
                          onChange={(e) => {
                            const updated = [...hawbs];
                            updated[idx].hawb_number = e.target.value;
                            setHawbs(updated);
                          }}
                          className="erp-input inline-block w-36 ml-2 py-0.5 px-2 text-xs font-mono font-bold"
                        />
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveHawb(h.id)}
                        className="erp-icon-btn text-rose-500"
                        title="Eliminar Guía Hija"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Remitente Guía Hija */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-muted">2. Remitente (Guía Hija)</label>
                        <input
                          type="text"
                          placeholder="Nombre Remitente Final"
                          value={h.shipper_name}
                          onChange={(e) => {
                            const updated = [...hawbs];
                            updated[idx].shipper_name = e.target.value;
                            setHawbs(updated);
                          }}
                          className="erp-input text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="NIT / Documento"
                            value={h.shipper_nit}
                            onChange={(e) => {
                              const updated = [...hawbs];
                              updated[idx].shipper_nit = e.target.value;
                              setHawbs(updated);
                            }}
                            className="erp-input text-xs font-mono"
                          />
                          <input
                            type="text"
                            placeholder="Ciudad, País"
                            value={h.shipper_city_country}
                            onChange={(e) => {
                              const updated = [...hawbs];
                              updated[idx].shipper_city_country = e.target.value;
                              setHawbs(updated);
                            }}
                            className="erp-input text-xs"
                          />
                        </div>
                      </div>

                      {/* Consignatario Guía Hija */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-muted">3. Consignatario (Guía Hija)</label>
                        <input
                          type="text"
                          placeholder="Nombre Consignatario Final"
                          value={h.consignee_name}
                          onChange={(e) => {
                            const updated = [...hawbs];
                            updated[idx].consignee_name = e.target.value;
                            setHawbs(updated);
                          }}
                          className="erp-input text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="RFC / Tax ID"
                            value={h.consignee_tax_id}
                            onChange={(e) => {
                              const updated = [...hawbs];
                              updated[idx].consignee_tax_id = e.target.value;
                              setHawbs(updated);
                            }}
                            className="erp-input text-xs font-mono"
                          />
                          <input
                            type="text"
                            placeholder="Ciudad, País"
                            value={h.consignee_city_country}
                            onChange={(e) => {
                              const updated = [...hawbs];
                              updated[idx].consignee_city_country = e.target.value;
                              setHawbs(updated);
                            }}
                            className="erp-input text-xs"
                          />
                        </div>
                      </div>

                      {/* Carga Guía Hija */}
                      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] text-muted font-bold block">16. Bultos (Pieces)</label>
                          <input
                            type="number"
                            value={h.pieces}
                            onChange={(e) => {
                              const updated = [...hawbs];
                              updated[idx].pieces = parseInt(e.target.value) || 1;
                              setHawbs(updated);
                            }}
                            className="erp-input text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted font-bold block">Gross Weight (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={h.gross_weight}
                            onChange={(e) => {
                              const updated = [...hawbs];
                              updated[idx].gross_weight = parseFloat(e.target.value) || 0;
                              setHawbs(updated);
                            }}
                            className="erp-input text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted font-bold block">Rate / Charge Display</label>
                          <input
                            type="text"
                            value={h.rate_charge_display}
                            onChange={(e) => {
                              const updated = [...hawbs];
                              updated[idx].rate_charge_display = e.target.value;
                              setHawbs(updated);
                            }}
                            className="erp-input text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted font-bold block">Total Display</label>
                          <input
                            type="text"
                            value={h.total_charge_display}
                            onChange={(e) => {
                              const updated = [...hawbs];
                              updated[idx].total_charge_display = e.target.value;
                              setHawbs(updated);
                            }}
                            className="erp-input text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-muted font-bold block">Naturaleza y Cantidad de Mercancía</label>
                        <textarea
                          rows={2}
                          value={h.nature_and_quantity}
                          onChange={(e) => {
                            const updated = [...hawbs];
                            updated[idx].nature_and_quantity = e.target.value;
                            setHawbs(updated);
                          }}
                          className="erp-input text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEPPER NAVIGATION BUTTONS (ANTERIOR / SIGUIENTE / GUARDAR)                */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`erp-btn-secondary ${currentStep === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-semibold hidden sm:inline">
              Paso {currentStep} de {totalSteps}
            </span>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="erp-btn-primary"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="erp-btn-primary"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Finalizar y Guardar Guía Aérea'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
