import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Ship,
  Plane,
  Truck,
  Building,
  Calendar,
  FileText,
  Tag,
  Layers,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ShippingInstructionService } from '../services/commercialService';
import {
  INCOTERMS,
  CARGO_TYPES,
  BOOKING_STATUSES,
  INSPECTION_STATUSES,
  STATUS_OPTIONS_BY_OPERATION,
  inferShipmentOperationType,
  type ShipmentTypeValue
} from '../types/shipment';
import {
  serializeDateForDb,
  serializeDateTimeForDb
} from '../lib/dateUtils';
import { useAuth } from '../context/AuthContext';
import { saveFormDraft, loadFormDraft, clearFormDraft } from '../lib/draftStorage';

export const ShipmentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const instructionId = searchParams.get('instructionId');
  const { profile } = useAuth();

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  // Companies for tracking portal assignment
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Form state
  const [doNumber, setDoNumber] = useState('');
  const [shipmentType, setShipmentType] = useState<ShipmentTypeValue>('maritime');
  const [currentStatus, setCurrentStatus] = useState('');
  const [exporter, setExporter] = useState('');
  const [consignee, setConsignee] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [carrier, setCarrier] = useState('');
  const [flightVessel, setFlightVessel] = useState('');
  const [airWaybill, setAirWaybill] = useState('');
  const [containerNumber, setContainerNumber] = useState('');
  const [incoterm, setIncoterm] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [freeDays, setFreeDays] = useState<string>('');
  const [bookingStatus, setBookingStatus] = useState('pending');
  const [inspectionStatus, setInspectionStatus] = useState('none');

  // Dates
  const [etd, setEtd] = useState('');
  const [eta, setEta] = useState('');
  const [atd, setAtd] = useState('');
  const [ata, setAta] = useState('');
  const [documentaryCutoff, setDocumentaryCutoff] = useState('');

  // Observation
  const [initialObservation, setInitialObservation] = useState('');

  // Load companies and prefill from instruction if passed
  useEffect(() => {
    const initData = async () => {
      let loadedComps: { id: string; name: string }[] = [];
      try {
        const { data: compList } = await supabase
          .from('companies')
          .select('id, name')
          .order('name', { ascending: true });
        loadedComps = (compList as { id: string; name: string }[]) || [];
        setCompanies(loadedComps);
      } catch (err) {
        console.error('Error cargando empresas:', err);
      }

      if (instructionId) {
        try {
          const inst = await ShippingInstructionService.getInstructionById(instructionId);
          if (inst) {
            setDoNumber(inst.do_number || '');

            const viaUpper = (inst.via || '').toUpperCase();
            if (viaUpper.includes('AER') || viaUpper.includes('AIR')) {
              setShipmentType('air');
            } else if (viaUpper.includes('TERR') || viaUpper.includes('LAND')) {
              setShipmentType('land');
            } else {
              setShipmentType('maritime');
            }

            if (inst.incoterm) {
              setIncoterm(inst.incoterm);
            }

            if (inst.cliente) {
              setConsignee(inst.cliente);
              const clientLower = inst.cliente.toLowerCase().trim();
              const matched = loadedComps.find(
                c => c.name.toLowerCase().trim() === clientLower ||
                     clientLower.includes(c.name.toLowerCase().trim()) ||
                     c.name.toLowerCase().trim().includes(clientLower)
              );
              if (matched) {
                setSelectedCompanyId(matched.id);
              }
            }

            if (inst.ruta) {
              const parts = inst.ruta.split(/[-–/]/);
              if (parts.length >= 2) {
                setOrigin(parts[0].trim());
                setDestination(parts[1].trim());
              } else {
                setOrigin(inst.ruta.trim());
              }
            }

            if (inst.concepts && inst.concepts.length > 0) {
              const firstCarrier = inst.concepts.find(c => c.proveedor)?.proveedor;
              if (firstCarrier) {
                setCarrier(firstCarrier);
              }
            }

            let obs = `Apertura de tráfico desde Instrucción de Embarque DO: ${inst.do_number}. Vía: ${inst.via} | Modalidad: ${inst.modalidad || '--'}. Comercial: ${inst.comercial || '--'}.`;
            if (inst.comentarios) {
              obs += `\nNotas operativas: ${inst.comentarios}`;
            }
            if (inst.concepts && inst.concepts.length > 0) {
              obs += `\nConceptos cotizados/instruidos:\n` + inst.concepts.map(c => `• ${c.concepto}: Tarifa Venta ${c.moneda_venta || 'USD'} ${c.venta || '0'} | Costo ${c.moneda_costo || 'USD'} ${c.costo || '0'} (${c.proveedor || 'S/P'})`).join('\n');
            }
            setInitialObservation(obs);
          }
        } catch (err) {
          console.error('Error al precargar instrucción:', err);
        }
      } else {
        // Restaurar borrador previo si existe y el usuario no venía desde una instrucción
        const draft = loadFormDraft<any>('shipment_create');
        if (draft) {
          if (draft.doNumber) setDoNumber(draft.doNumber);
          if (draft.shipmentType) setShipmentType(draft.shipmentType);
          if (draft.currentStatus) setCurrentStatus(draft.currentStatus);
          if (draft.exporter) setExporter(draft.exporter);
          if (draft.consignee) setConsignee(draft.consignee);
          if (draft.origin) setOrigin(draft.origin);
          if (draft.destination) setDestination(draft.destination);
          if (draft.carrier) setCarrier(draft.carrier);
          if (draft.flightVessel) setFlightVessel(draft.flightVessel);
          if (draft.airWaybill) setAirWaybill(draft.airWaybill);
          if (draft.containerNumber) setContainerNumber(draft.containerNumber);
          if (draft.incoterm) setIncoterm(draft.incoterm);
          if (draft.cargoType) setCargoType(draft.cargoType);
          if (draft.freeDays) setFreeDays(draft.freeDays);
          if (draft.bookingStatus) setBookingStatus(draft.bookingStatus);
          if (draft.inspectionStatus) setInspectionStatus(draft.inspectionStatus);
          if (draft.etd) setEtd(draft.etd);
          if (draft.eta) setEta(draft.eta);
          if (draft.atd) setAtd(draft.atd);
          if (draft.ata) setAta(draft.ata);
          if (draft.documentaryCutoff) setDocumentaryCutoff(draft.documentaryCutoff);
          if (draft.initialObservation) setInitialObservation(draft.initialObservation);
          if (draft.selectedCompanyId) setSelectedCompanyId(draft.selectedCompanyId);
          setDraftRestored(true);
        }
      }
    };

    initData();
  }, [instructionId]);

  // Auto-guardado de borrador en sessionStorage para no perder datos si el usuario cambia de pestaña o navega
  useEffect(() => {
    if (instructionId) return;
    if (!doNumber && !consignee && !origin && !destination && !carrier && !exporter) return;
    saveFormDraft('shipment_create', {
      doNumber,
      shipmentType,
      currentStatus,
      exporter,
      consignee,
      origin,
      destination,
      carrier,
      flightVessel,
      airWaybill,
      containerNumber,
      incoterm,
      cargoType,
      freeDays,
      bookingStatus,
      inspectionStatus,
      etd,
      eta,
      atd,
      ata,
      documentaryCutoff,
      initialObservation,
      selectedCompanyId,
    });
  }, [
    instructionId, doNumber, shipmentType, currentStatus, exporter, consignee,
    origin, destination, carrier, flightVessel, airWaybill, containerNumber,
    incoterm, cargoType, freeDays, bookingStatus, inspectionStatus, etd, eta,
    atd, ata, documentaryCutoff, initialObservation, selectedCompanyId,
  ]);

  const opType = inferShipmentOperationType(doNumber) || 'expo';
  const statusOptions = STATUS_OPTIONS_BY_OPERATION[opType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanDo = doNumber.trim().toUpperCase();
    if (!cleanDo) {
      setErrorMsg('El número de DO / Operación es obligatorio.');
      return;
    }
    if (!origin.trim() || !destination.trim()) {
      setErrorMsg('Origen y Destino son obligatorios.');
      return;
    }

    try {
      setSaving(true);
      const nowIso = new Date().toISOString();

      const newShipmentPayload = {
        do_number: cleanDo,
        shipment_type: shipmentType,
        current_status: currentStatus || statusOptions[0].value,
        exporter: exporter.trim() || null,
        consignee: consignee.trim() || null,
        origin: origin.trim(),
        destination: destination.trim(),
        carrier: carrier.trim() || null,
        flight_vessel: flightVessel.trim() || null,
        air_waybill: airWaybill.trim() || null,
        container_number: containerNumber.trim().toUpperCase() || null,
        incoterm: incoterm || null,
        cargo_type: cargoType || null,
        free_days: freeDays ? parseInt(freeDays, 10) : null,
        booking_status: bookingStatus || null,
        inspection_status: inspectionStatus || null,
        etd: serializeDateForDb(etd),
        eta: serializeDateForDb(eta),
        atd: serializeDateTimeForDb(atd),
        ata: serializeDateTimeForDb(ata),
        documentary_cutoff: serializeDateTimeForDb(documentaryCutoff),
        status: 'active',
        created_by: profile?.id,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const { data: createdShipment, error: insertError } = await supabase
        .from('shipments')
        .insert(newShipmentPayload)
        .select()
        .single();

      if (insertError) throw insertError;

      if (initialObservation.trim() && createdShipment?.id) {
        await supabase.from('shipment_updates').insert({
          shipment_id: createdShipment.id,
          status: newShipmentPayload.current_status,
          observation: initialObservation.trim(),
          updated_by: profile?.id,
          event_type: 'status_update',
          created_at: nowIso,
        });
      }

      if (selectedCompanyId && createdShipment?.id) {
        await supabase.from('company_shipment').insert({
          company_id: selectedCompanyId,
          shipment_id: createdShipment.id,
        });
      }

      clearFormDraft('shipment_create');
      navigate(`/shipments/${createdShipment.id}`);
    } catch (err: any) {
      console.error('Error al registrar carga:', err);
      setErrorMsg(err.message || 'Error inesperado al crear la carga');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/operations')}
            className="erp-btn-secondary p-2"
            aria-label="Volver a Control de Tráfico"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="erp-page-title">Registrar Nueva Operación</h1>
            <p className="erp-page-subtitle">Ingreso centralizado de expediente de tráfico</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="erp-btn-primary self-start sm:self-auto"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando expediente...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Operación</span>
            </>
          )}
        </button>
      </div>

      {draftRestored && (
        <div className="erp-badge-emerald w-full p-3 rounded-xl flex items-center justify-between text-xs">
          <span>Borrador restaurado automáticamente. Tu progreso no se perdió al cambiar de página.</span>
          <button
            type="button"
            onClick={() => {
              clearFormDraft('shipment_create');
              setDraftRestored(false);
            }}
            className="underline cursor-pointer text-[10px] ml-3 text-emerald-700 dark:text-emerald-300"
          >
            Descartar borrador
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="erp-badge-danger w-full p-4 rounded-xl flex items-start gap-3 text-xs justify-start">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Main form grid */}
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {/* SECCIÓN 1: Identificación y Modo */}
        <div className="erp-card">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--brand-orange-text)' }}>
            <Tag className="w-4 h-4" /> 1. Identificación y Modalidad
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="erp-label">
                Número de DO / Referencia *
              </label>
              <input
                type="text"
                required
                value={doNumber}
                onChange={(e) => setDoNumber(e.target.value)}
                placeholder="Ej: EXP-26042 o IMP-10892"
                className="erp-input font-mono font-bold uppercase"
              />
              <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>
                Prefijo EXP / X = Exportación, IMP / M = Importación
              </span>
            </div>

            <div>
              <label className="erp-label">
                Modo de Transporte *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setShipmentType('maritime')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-semibold transition-all border ${
                    shipmentType === 'maritime'
                      ? 'erp-badge-blue'
                      : 'erp-btn-secondary'
                  }`}
                >
                  <Ship className="w-4 h-4 mb-1" />
                  <span>Marítimo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShipmentType('air')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-semibold transition-all border ${
                    shipmentType === 'air'
                      ? 'erp-badge-blue'
                      : 'erp-btn-secondary'
                  }`}
                >
                  <Plane className="w-4 h-4 mb-1" />
                  <span>Aéreo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShipmentType('land')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-semibold transition-all border ${
                    shipmentType === 'land'
                      ? 'erp-badge-warning'
                      : 'erp-btn-secondary'
                  }`}
                >
                  <Truck className="w-4 h-4 mb-1" />
                  <span>Terrestre</span>
                </button>
              </div>
            </div>

            <div>
              <label className="erp-label">
                Estado Operativo Inicial
              </label>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="erp-select"
              >
                {statusOptions.map((st) => (
                  <option key={st.value} value={st.value}>
                    Paso {st.step}: {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Partes y Ruta */}
        <div className="erp-card">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--brand-orange-text)' }}>
            <Building className="w-4 h-4" /> 2. Clientes y Ruta Logística
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="erp-label">
                Exportador
              </label>
              <input
                type="text"
                value={exporter}
                onChange={(e) => setExporter(e.target.value)}
                placeholder="Nombre o Razón Social"
                className="erp-input"
              />
            </div>

            <div>
              <label className="erp-label">
                Consignatario
              </label>
              <input
                type="text"
                value={consignee}
                onChange={(e) => setConsignee(e.target.value)}
                placeholder="Nombre o Razón Social"
                className="erp-input"
              />
            </div>

            <div>
              <label className="erp-label">
                Puerto / Ciudad de Origen *
              </label>
              <input
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Ej: Cartagena, Buenaventura, Miami"
                className="erp-input"
              />
            </div>

            <div>
              <label className="erp-label">
                Puerto / Ciudad de Destino *
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ej: Rotterdam, Manzanillo, Bogotá"
                className="erp-input"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 pt-3 mt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="erp-label mb-0.5">
                    Asignar Empresa del Portal de Clientes (Tracking)
                  </label>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Permite que el cliente visualice esta carga en tiempo real desde <strong>como-va-mi-carga.ingelox.com.co</strong>.
                  </p>
                </div>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="erp-select sm:w-80 text-xs"
                >
                  <option value="">-- Sin asignar al portal aún --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Transportador y Equipos */}
        <div className="erp-card">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--brand-orange-text)' }}>
            <Layers className="w-4 h-4" /> 3. Línea, Equipos y Documentos de Transporte
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="erp-label">
                Transportador
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="Ej: Maersk, Evergreen, Avianca"
                className="erp-input"
              />
            </div>

            <div>
              <label className="erp-label">
                Motonave / Vuelo / Placa
              </label>
              <input
                type="text"
                value={flightVessel}
                onChange={(e) => setFlightVessel(e.target.value)}
                placeholder="Ej: SEASPAN FUZHOU 012E"
                className="erp-input"
              />
            </div>

            <div>
              <label className="erp-label">
                Documento de Transporte / Booking
              </label>
              <input
                type="text"
                value={airWaybill}
                onChange={(e) => setAirWaybill(e.target.value)}
                placeholder="Ej: DOCAU26042A"
                className="erp-input font-mono"
              />
            </div>

            <div>
              <label className="erp-label">
                Contenedor(es)
              </label>
              <input
                type="text"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                placeholder="MSCU1234567, TCLU7654321 o LCL"
                className="erp-input font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Fechas y Tiempos */}
        <div className="erp-card">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--brand-orange-text)' }}>
            <Calendar className="w-4 h-4" /> 4. Cronograma y Fechas (Hora Local)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="erp-label">
                ETD
              </label>
              <input
                type="date"
                value={etd}
                onChange={(e) => setEtd(e.target.value)}
                className="erp-input font-mono"
              />
            </div>

            <div>
              <label className="erp-label">
                ETA
              </label>
              <input
                type="date"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="erp-input font-mono"
              />
            </div>

            <div>
              <label className="erp-label">
                ATD
              </label>
              <input
                type="datetime-local"
                value={atd}
                onChange={(e) => setAtd(e.target.value)}
                className="erp-input font-mono"
              />
            </div>

            <div>
              <label className="erp-label">
                ATA
              </label>
              <input
                type="datetime-local"
                value={ata}
                onChange={(e) => setAta(e.target.value)}
                className="erp-input font-mono"
              />
            </div>

            <div>
              <label className="erp-label">
                Cutoff Documental
              </label>
              <input
                type="datetime-local"
                value={documentaryCutoff}
                onChange={(e) => setDocumentaryCutoff(e.target.value)}
                className="erp-input font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: Condiciones Comerciales y Aduaneras */}
        <div className="erp-card">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--brand-orange-text)' }}>
            <FileText className="w-4 h-4" /> 5. Régimen, Días Libres y Observaciones
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="erp-label">
                Incoterm
              </label>
              <select
                value={incoterm}
                onChange={(e) => setIncoterm(e.target.value)}
                className="erp-select font-mono"
              >
                {INCOTERMS.map((term) => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="erp-label">
                Tipo de Carga
              </label>
              <select
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                className="erp-select"
              >
                {CARGO_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="erp-label">
                Estado de Booking
              </label>
              <select
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value)}
                className="erp-select"
              >
                {BOOKING_STATUSES.map((bs) => (
                  <option key={bs.value} value={bs.value}>{bs.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="erp-label">
                Días Libres
              </label>
              <input
                type="number"
                min="0"
                value={freeDays}
                onChange={(e) => setFreeDays(e.target.value)}
                placeholder="Ej: 14"
                className="erp-input font-mono"
              />
            </div>

            <div>
              <label className="erp-label">
                Inspección Aduanera
              </label>
              <select
                value={inspectionStatus}
                onChange={(e) => setInspectionStatus(e.target.value)}
                className="erp-select"
              >
                {INSPECTION_STATUSES.map((is) => (
                  <option key={is.value} value={is.value}>{is.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="erp-label">
              Observaciones iniciales
            </label>
            <textarea
              rows={3}
              value={initialObservation}
              onChange={(e) => setInitialObservation(e.target.value)}
              placeholder="Instrucciones especiales, detalle de mercancía, comentarios para el cliente o el equipo..."
              className="erp-textarea"
            />
          </div>
        </div>

        {/* Submit bottom bar */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/operations')}
            className="erp-btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="erp-btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando expediente...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Crear Carga</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
