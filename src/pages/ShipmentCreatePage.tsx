import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export const ShipmentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  const [incoterm, setIncoterm] = useState('FOB');
  const [cargoType, setCargoType] = useState('general');
  const [freeDays, setFreeDays] = useState<string>('');
  const [bookingStatus, setBookingStatus] = useState('confirmed');
  const [inspectionStatus, setInspectionStatus] = useState('none');

  // Dates
  const [etd, setEtd] = useState('');
  const [eta, setEta] = useState('');
  const [atd, setAtd] = useState('');
  const [ata, setAta] = useState('');
  const [documentaryCutoff, setDocumentaryCutoff] = useState('');

  // Observation
  const [initialObservation, setInitialObservation] = useState('');

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

      // Si hay observación inicial, registrar en shipment_updates
      if (initialObservation.trim() && createdShipment?.id) {
        await supabase.from('shipment_updates').insert({
          shipment_id: createdShipment.id,
          status: newShipmentPayload.current_status,
          description: initialObservation.trim(),
          created_by: profile?.id,
          created_at: nowIso,
        });
      }

      navigate(`/shipments/${createdShipment.id}`);
    } catch (err: any) {
      console.error('Error al registrar carga:', err);
      setErrorMsg(err.message || 'Error inesperado al crear la carga');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/operations')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Registrar Nueva Operación</h1>
            <p className="text-xs text-slate-400">Ingreso centralizado de expediente de tráfico</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-brand-orange/20 transition-all cursor-pointer"
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

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Main form grid */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN 1: Identificación y Modo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 text-brand-orange">
            <Tag className="w-4 h-4" /> 1. Identificación y Modalidad
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Número de DO / Referencia *
              </label>
              <input
                type="text"
                required
                value={doNumber}
                onChange={(e) => setDoNumber(e.target.value)}
                placeholder="Ej: EXP-26042 o IMP-10892"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange uppercase font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Prefijo EXP / X = Exportación, IMP / M = Importación
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Modo de Transporte *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setShipmentType('maritime')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                    shipmentType === 'maritime'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Ship className="w-4 h-4 mb-1" />
                  <span>Marítimo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShipmentType('air')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                    shipmentType === 'air'
                      ? 'bg-sky-600/20 border-sky-500 text-sky-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Plane className="w-4 h-4 mb-1" />
                  <span>Aéreo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShipmentType('land')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                    shipmentType === 'land'
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Truck className="w-4 h-4 mb-1" />
                  <span>Terrestre</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estado Operativo Inicial
              </label>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 text-brand-orange">
            <Building className="w-4 h-4" /> 2. Clientes y Ruta Logística
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Exportador / Remitente
              </label>
              <input
                type="text"
                value={exporter}
                onChange={(e) => setExporter(e.target.value)}
                placeholder="Nombre o Razón Social"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Consignatario / Destinatario
              </label>
              <input
                type="text"
                value={consignee}
                onChange={(e) => setConsignee(e.target.value)}
                placeholder="Nombre o Razón Social"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Puerto / Ciudad de Origen *
              </label>
              <input
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Ej: Cartagena, Buenaventura, Miami"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Puerto / Ciudad de Destino *
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ej: Rotterdam, Manzanillo, Bogotá"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Transportadora y Equipos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 text-brand-orange">
            <Layers className="w-4 h-4" /> 3. Línea, Equipos y Documentos de Transporte
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Línea / Naviera / Aerolínea
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="Ej: Maersk, Evergreen, Avianca"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Motonave / Vuelo / Placa
              </label>
              <input
                type="text"
                value={flightVessel}
                onChange={(e) => setFlightVessel(e.target.value)}
                placeholder="Ej: SEASPAN FUZHOU 012E"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Booking / Master / AWB / Guía
              </label>
              <input
                type="text"
                value={airWaybill}
                onChange={(e) => setAirWaybill(e.target.value)}
                placeholder="Ej: DOCAU26042A"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contenedor(es)
              </label>
              <input
                type="text"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                placeholder="MSCU1234567, TCLU7654321 o LCL"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange uppercase"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Fechas y Tiempos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 text-brand-orange">
            <Calendar className="w-4 h-4" /> 4. Cronograma y Fechas (Hora Local)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ETD (Estimada Salida)
              </label>
              <input
                type="date"
                value={etd}
                onChange={(e) => setEtd(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ETA (Estimada Llegada)
              </label>
              <input
                type="date"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ATD (Real Salida)
              </label>
              <input
                type="datetime-local"
                value={atd}
                onChange={(e) => setAtd(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ATA (Real Llegada)
              </label>
              <input
                type="datetime-local"
                value={ata}
                onChange={(e) => setAta(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cutoff Documental
              </label>
              <input
                type="datetime-local"
                value={documentaryCutoff}
                onChange={(e) => setDocumentaryCutoff(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: Condiciones Comerciales y Aduaneras */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 text-brand-orange">
            <FileText className="w-4 h-4" /> 5. Régimen, Días Libres y Observaciones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Incoterm
              </label>
              <select
                value={incoterm}
                onChange={(e) => setIncoterm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              >
                {INCOTERMS.map((term) => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Carga
              </label>
              <select
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              >
                {CARGO_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estado de Booking
              </label>
              <select
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              >
                {BOOKING_STATUSES.map((bs) => (
                  <option key={bs.value} value={bs.value}>{bs.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Días Libres Pactados
              </label>
              <input
                type="number"
                min="0"
                value={freeDays}
                onChange={(e) => setFreeDays(e.target.value)}
                placeholder="Ej: 14"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Inspección Aduanera
              </label>
              <select
                value={inspectionStatus}
                onChange={(e) => setInspectionStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
              >
                {INSPECTION_STATUSES.map((is) => (
                  <option key={is.value} value={is.value}>{is.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observación Inicial de Apertura de Expediente
            </label>
            <textarea
              rows={3}
              value={initialObservation}
              onChange={(e) => setInitialObservation(e.target.value)}
              placeholder="Instrucciones especiales, detalle de mercancía, comentarios para el cliente o el equipo..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange resize-none"
            />
          </div>
        </div>

        {/* Submit bottom bar */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/operations')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-brand-orange/20 transition-all cursor-pointer"
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
