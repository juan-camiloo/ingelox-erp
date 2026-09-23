import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Ship,
  Plane,
  Truck,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  Plus,
  Eye,
  Layers,
  MessageSquarePlus,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Shipment, ShipmentTypeValue } from '../types/shipment';
import {
  STATUS_OPTIONS_BY_OPERATION,
  getShipmentStatusLabel,
  inferShipmentOperationType
} from '../types/shipment';
import {
  formatDateDisplay,
  isEtaOverdue,
  calculateFreeDaysRemaining
} from '../lib/dateUtils';
import { useAuth } from '../context/AuthContext';

type TabKey = 'all' | 'in_transit' | 'customs' | 'overdue_eta' | 'free_days_alert';

export const OperationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedOp, setSelectedOp] = useState<string>('all');

  // Modal para agregar Novedad / Actualización rápida
  const [quickUpdateShipment, setQuickUpdateShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newObservation, setNewObservation] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchShipments = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id, do_number, origin, destination, shipment_type,
          current_status, incoterm, etd, eta,
          atd, ata, documentary_cutoff, booking_status, inspection_status,
          cargo_type, free_days, carrier, flight_vessel, air_waybill,
          container_number, exporter, consignee, created_at, created_by,
          updated_by, updated_at, status
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments((data as Shipment[]) || []);
    } catch (err) {
      console.error('Error fetching shipments in ERP:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  // Sincronizar parámetro de búsqueda de la URL
  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  // Manejo de actualización rápida
  const handleOpenQuickUpdate = (shipment: Shipment) => {
    setQuickUpdateShipment(shipment);
    setNewStatus(shipment.current_status || '');
    setNewObservation('');
    setNewLocation('');
    setUpdateError(null);
  };

  const handleSaveQuickUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUpdateShipment) return;
    setSavingUpdate(true);
    setUpdateError(null);

    try {
      const nowIso = new Date().toISOString();
      const updatesPayload: any = {
        updated_at: nowIso,
        updated_by: profile?.id,
      };

      if (newStatus && newStatus !== quickUpdateShipment.current_status) {
        updatesPayload.current_status = newStatus;
      }

      // 1. Actualizar shipment
      const { error: shipmentErr } = await supabase
        .from('shipments')
        .update(updatesPayload)
        .eq('id', quickUpdateShipment.id);

      if (shipmentErr) throw shipmentErr;

      // 2. Si hay observación o cambio de estado, registrar en shipment_updates
      if (newObservation.trim() || (newStatus && newStatus !== quickUpdateShipment.current_status)) {
        const { error: updateErr } = await supabase
          .from('shipment_updates')
          .insert({
            shipment_id: quickUpdateShipment.id,
            status: newStatus || quickUpdateShipment.current_status || 'actualizacion',
            observation: newObservation.trim() || `Estado actualizado a ${getShipmentStatusLabel(newStatus)}`,
            location: newLocation.trim() || null,
            updated_by: profile?.id,
            event_type: 'status_update',
            created_at: nowIso,
          });

        if (updateErr) {
          console.warn('Advertencia registrando en historial:', updateErr);
        }
      }

      // Éxito: cerrar modal y refrescar
      setQuickUpdateShipment(null);
      await fetchShipments();
    } catch (err: any) {
      console.error('Error guardando actualización rápida:', err);
      setUpdateError(err.message || 'Error al guardar la actualización');
    } finally {
      setSavingUpdate(false);
    }
  };

  // Filtrado y Métricas
  const { filteredShipments, metrics } = useMemo(() => {
    let overdueCount = 0;
    let freeDaysAlertCount = 0;
    let inTransitCount = 0;
    let customsCount = 0;

    shipments.forEach((s) => {
      if (isEtaOverdue(s.eta, s.current_status)) {
        overdueCount++;
      }
      const freeDaysInfo = calculateFreeDaysRemaining(s.ata || s.eta, s.free_days);
      if (freeDaysInfo && (freeDaysInfo.isExpiringSoon || freeDaysInfo.isOverdue)) {
        freeDaysAlertCount++;
      }
      const st = s.current_status || '';
      if (st.includes('transit') || st === 'on_way' || st.includes('departure')) {
        inTransitCount++;
      }
      if (st.includes('customs') || s.inspection_status === 'physical' || s.inspection_status === 'documentary') {
        customsCount++;
      }
    });

    const filtered = shipments.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'in_transit') {
        const st = item.current_status || '';
        if (!st.includes('transit') && st !== 'on_way' && !st.includes('departure')) return false;
      } else if (activeTab === 'customs') {
        const st = item.current_status || '';
        if (!st.includes('customs') && item.inspection_status !== 'physical' && item.inspection_status !== 'documentary') return false;
      } else if (activeTab === 'overdue_eta') {
        if (!isEtaOverdue(item.eta, item.current_status)) return false;
      } else if (activeTab === 'free_days_alert') {
        const fd = calculateFreeDaysRemaining(item.ata || item.eta, item.free_days);
        if (!fd || (!fd.isExpiringSoon && !fd.isOverdue)) return false;
      }

      // 2. Type filter
      if (selectedType !== 'all') {
        if (item.shipment_type !== selectedType) return false;
      }

      // 3. Operation filter
      if (selectedOp !== 'all') {
        const op = inferShipmentOperationType(item.do_number);
        if (op !== selectedOp) return false;
      }

      // 4. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDo = item.do_number?.toLowerCase().includes(q);
        const matchesCarrier = item.carrier?.toLowerCase().includes(q);
        const matchesContainer = item.container_number?.toLowerCase().includes(q);
        const matchesAwb = item.air_waybill?.toLowerCase().includes(q);
        const matchesExporter = item.exporter?.toLowerCase().includes(q);
        const matchesConsignee = item.consignee?.toLowerCase().includes(q);
        const matchesOrigin = item.origin?.toLowerCase().includes(q);
        const matchesDest = item.destination?.toLowerCase().includes(q);

        if (!matchesDo && !matchesCarrier && !matchesContainer && !matchesAwb && !matchesExporter && !matchesConsignee && !matchesOrigin && !matchesDest) {
          return false;
        }
      }

      return true;
    });

    return {
      filteredShipments: filtered,
      metrics: {
        total: shipments.length,
        inTransit: inTransitCount,
        customs: customsCount,
        overdue: overdueCount,
        freeDaysAlert: freeDaysAlertCount,
      },
    };
  }, [shipments, activeTab, selectedType, selectedOp, searchQuery]);

  const renderTransportIcon = (type?: ShipmentTypeValue | null) => {
    switch (type) {
      case 'air':
        return <Plane className="w-4 h-4 text-sky-400" />;
      case 'maritime':
        return <Ship className="w-4 h-4 text-blue-400" />;
      case 'land':
        return <Truck className="w-4 h-4 text-amber-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & METRIC KPI CARDS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Matriz de Tráfico y Operaciones
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredShipments.length} de {shipments.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Control de despachos, tránsitos internacionales, navieras y aduanas
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchShipments}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-orange' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={() => navigate('/shipments/new')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-md shadow-brand-orange/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Carga</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-800/90 border-brand-orange/60 shadow-lg shadow-brand-orange/5'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
          }`}
        >
          <div className="text-[11px] font-medium text-slate-400 mb-1">Total Activas</div>
          <div className="text-xl font-bold text-white">{metrics.total}</div>
        </button>

        <button
          onClick={() => setActiveTab('in_transit')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'in_transit'
              ? 'bg-slate-800/90 border-blue-500/60 shadow-lg shadow-blue-500/5'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
          }`}
        >
          <div className="text-[11px] font-medium text-blue-400 mb-1 flex items-center gap-1">
            <Ship className="w-3.5 h-3.5" /> En Tránsito
          </div>
          <div className="text-xl font-bold text-blue-100">{metrics.inTransit}</div>
        </button>

        <button
          onClick={() => setActiveTab('customs')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'customs'
              ? 'bg-slate-800/90 border-purple-500/60 shadow-lg shadow-purple-500/5'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
          }`}
        >
          <div className="text-[11px] font-medium text-purple-400 mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> En Aduana
          </div>
          <div className="text-xl font-bold text-purple-100">{metrics.customs}</div>
        </button>

        <button
          onClick={() => setActiveTab('overdue_eta')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'overdue_eta'
              ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
          }`}
        >
          <div className="text-[11px] font-medium text-rose-400 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> ETA Vencido
          </div>
          <div className="text-xl font-bold text-rose-300">{metrics.overdue}</div>
        </button>

        <button
          onClick={() => setActiveTab('free_days_alert')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'free_days_alert'
              ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
          }`}
        >
          <div className="text-[11px] font-medium text-amber-400 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Días Libres {'< 3d'}
          </div>
          <div className="text-xl font-bold text-amber-300">{metrics.freeDaysAlert}</div>
        </button>
      </div>

      {/* FILTER BAR & SEARCH */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por DO, contenedor, cliente..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-orange"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Operación */}
          <select
            value={selectedOp}
            onChange={(e) => setSelectedOp(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-orange"
          >
            <option value="all">Todas las operaciones</option>
            <option value="expo">Exportación (EXPO)</option>
            <option value="impo">Importación (IMPO)</option>
          </select>

          {/* Modalidad */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-orange"
          >
            <option value="all">Todos los modos</option>
            <option value="maritime">Marítimo</option>
            <option value="air">Aéreo</option>
            <option value="land">Terrestre</option>
          </select>

          {(searchQuery || selectedType !== 'all' || selectedOp !== 'all' || activeTab !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedOp('all');
                setActiveTab('all');
              }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 underline cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* DATA GRID TABLE */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3.5">DO / Referencia</th>
                <th className="py-3 px-3">Modo</th>
                <th className="py-3 px-3">Exportador / Consignatario</th>
                <th className="py-3 px-3">Ruta (Origen → Destino)</th>
                <th className="py-3 px-3">Transportadora / Ref</th>
                <th className="py-3 px-3">ETD / ATD</th>
                <th className="py-3 px-3">ETA / ATA</th>
                <th className="py-3 px-3 text-center">Días Libres</th>
                <th className="py-3 px-3">Estado Operativo</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-orange" />
                      <span>Cargando matriz de tráfico...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No se encontraron cargas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => {
                  const opType = inferShipmentOperationType(shipment.do_number);
                  const overdue = isEtaOverdue(shipment.eta, shipment.current_status);
                  const freeDaysInfo = calculateFreeDaysRemaining(shipment.ata || shipment.eta, shipment.free_days);

                  return (
                    <tr
                      key={shipment.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/shipments/${shipment.id}`)}
                    >
                      {/* DO / Operación */}
                      <td className="py-3 px-3.5 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white group-hover:text-brand-orange transition-colors">
                            {shipment.do_number}
                          </span>
                          {opType && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                opType === 'expo'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {opType}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Modo */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          {renderTransportIcon(shipment.shipment_type)}
                          <span className="capitalize">{shipment.shipment_type || '--'}</span>
                        </div>
                      </td>

                      {/* Exportador / Consignatario */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="truncate text-slate-200 font-medium" title={shipment.consignee || '--'}>
                          {shipment.consignee || '--'}
                        </div>
                        <div className="truncate text-[10px] text-slate-400" title={shipment.exporter || '--'}>
                          Exp: {shipment.exporter || '--'}
                        </div>
                      </td>

                      {/* Ruta */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-slate-200 font-medium">
                          {shipment.origin || '--'}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          → {shipment.destination || '--'}
                        </div>
                      </td>

                      {/* Carrier / Flight / Vessel / Container */}
                      <td className="py-3 px-3 max-w-[180px]">
                        <div className="truncate text-slate-200 font-medium" title={shipment.carrier || '--'}>
                          {shipment.carrier || '--'}
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          {shipment.container_number || shipment.air_waybill || shipment.flight_vessel || '--'}
                        </div>
                      </td>

                      {/* ETD / ATD */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-slate-200">
                          {formatDateDisplay(shipment.etd)}
                        </div>
                        {shipment.atd && (
                          <div className="text-[10px] text-emerald-400 font-medium">
                            ATD: {formatDateDisplay(shipment.atd)}
                          </div>
                        )}
                      </td>

                      {/* ETA / ATA */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={overdue ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                            {formatDateDisplay(shipment.eta)}
                          </span>
                          {overdue && (
                            <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[9px] font-bold">
                              DEMORA
                            </span>
                          )}
                        </div>
                        {shipment.ata && (
                          <div className="text-[10px] text-emerald-400 font-medium">
                            ATA: {formatDateDisplay(shipment.ata)}
                          </div>
                        )}
                      </td>

                      {/* Días Libres */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {freeDaysInfo ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              freeDaysInfo.isOverdue
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : freeDaysInfo.isExpiringSoon
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {freeDaysInfo.isOverdue
                              ? `VENCIDO (${Math.abs(freeDaysInfo.remainingDays)}d)`
                              : `${freeDaysInfo.remainingDays} días`}
                          </span>
                        ) : shipment.free_days ? (
                          <span className="text-slate-400 text-[11px]">{shipment.free_days}d pactados</span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">--</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                          {getShipmentStatusLabel(shipment.current_status)}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td
                        className="py-3 px-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenQuickUpdate(shipment)}
                            title="Actualización rápida / Novedad"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-orange hover:bg-brand-orange/10 transition-colors"
                          >
                            <MessageSquarePlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/shipments/${shipment.id}`)}
                            title="Ver detalles completos"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ACTUALIZACIÓN RÁPIDA */}
      {quickUpdateShipment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setQuickUpdateShipment(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-orange/20 text-brand-orange flex items-center justify-center font-bold">
                DO
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Actualización Rápida: {quickUpdateShipment.do_number}
                </h3>
                <p className="text-xs text-slate-400">
                  {quickUpdateShipment.consignee || quickUpdateShipment.exporter}
                </p>
              </div>
            </div>

            {updateError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {updateError}
              </div>
            )}

            <form onSubmit={handleSaveQuickUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nuevo Estado Operativo
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-orange"
                >
                  <option value="">Seleccionar estado...</option>
                  {(() => {
                    const op = inferShipmentOperationType(quickUpdateShipment.do_number) || 'expo';
                    return STATUS_OPTIONS_BY_OPERATION[op].map((st) => (
                      <option key={st.value} value={st.value}>
                        Paso {st.step}: {st.label}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ubicación actual (Opcional)
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Ej: Puerto de Buenaventura, Bodega Cartagena"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observación o Novedad (Se registrará en el historial de eventos)
                </label>
                <textarea
                  rows={3}
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  placeholder="Escribe el reporte o novedad de la operación..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-orange resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickUpdateShipment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUpdate}
                  className="px-4 py-2 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-orange/20 transition-all flex items-center gap-1.5"
                >
                  {savingUpdate ? 'Guardando...' : 'Guardar Actualización'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
