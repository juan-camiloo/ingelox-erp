import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { MarqueeText } from '../components/common/MarqueeText';
import {
  formatDateDisplay,
  isEtaOverdue,
  calculateFreeDaysRemaining
} from '../lib/dateUtils';
import { useAuth } from '../context/AuthContext';
import { STRINGS } from '../constants/strings';

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
        const effectiveStatus = newStatus || quickUpdateShipment.current_status || 'booking_confirmed';
        const effectiveLabel = getShipmentStatusLabel(effectiveStatus);
        const { error: updateErr } = await supabase
          .from('shipment_updates')
          .insert({
            shipment_id: quickUpdateShipment.id,
            status: effectiveStatus,
            observation: newObservation.trim() || `Estado actualizado a ${effectiveLabel}`,
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
          <h1 className="erp-page-title">
            {STRINGS.operations.title}
          </h1>
          <p className="erp-page-subtitle">
            {STRINGS.operations.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchShipments}
            disabled={refreshing}
            className="erp-btn-secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-orange' : ''}`} />
            <span>{STRINGS.operations.refresh}</span>
          </button>
          <button
            onClick={() => navigate('/shipments/new')}
            className="erp-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>{STRINGS.operations.registerCargo}</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTab('all')}
          className="erp-kpi-card"
          style={activeTab === 'all' ? {
            borderColor: 'var(--brand-orange)',
            boxShadow: '0 0 0 1px var(--brand-orange-ring)',
          } : {}}
        >
          <div className="erp-kpi-label">{STRINGS.operations.kpiTotal}</div>
          <div className="erp-kpi-value">{metrics.total}</div>
        </button>

        <button
          onClick={() => setActiveTab('in_transit')}
          className="erp-kpi-card"
          style={activeTab === 'in_transit' ? { borderColor: '#3b82f6', boxShadow: '0 0 0 1px rgba(59,130,246,0.3)' } : {}}
        >
          <div className="erp-kpi-label flex items-center gap-1 text-blue-500 dark:text-blue-400">
            <Ship className="w-3.5 h-3.5" /> {STRINGS.operations.kpiInTransit}
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-300">{metrics.inTransit}</div>
        </button>

        <button
          onClick={() => setActiveTab('customs')}
          className="erp-kpi-card"
          style={activeTab === 'customs' ? { borderColor: '#a855f7', boxShadow: '0 0 0 1px rgba(168,85,247,0.3)' } : {}}
        >
          <div className="erp-kpi-label flex items-center gap-1 text-purple-500 dark:text-purple-400">
            <Layers className="w-3.5 h-3.5" /> {STRINGS.operations.kpiCustoms}
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-300">{metrics.customs}</div>
        </button>

        <button
          onClick={() => setActiveTab('overdue_eta')}
          className="erp-kpi-card"
          style={activeTab === 'overdue_eta' ? { borderColor: '#f43f5e', boxShadow: '0 0 0 1px rgba(244,63,94,0.3)' } : {}}
        >
          <div className="erp-kpi-label flex items-center gap-1 text-rose-500 dark:text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" /> {STRINGS.operations.kpiOverdueEta}
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-300">{metrics.overdue}</div>
        </button>

        <button
          onClick={() => setActiveTab('free_days_alert')}
          className="erp-kpi-card"
          style={activeTab === 'free_days_alert' ? { borderColor: '#f59e0b', boxShadow: '0 0 0 1px rgba(245,158,11,0.3)' } : {}}
        >
          <div className="erp-kpi-label flex items-center gap-1 text-amber-500 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" /> {STRINGS.operations.kpiFreeDays}
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-300">{metrics.freeDaysAlert}</div>
        </button>
      </div>

      {/* FILTER BAR & SEARCH */}
      <div className="erp-filter-bar">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={STRINGS.operations.searchPlaceholder}
            className="erp-search-input"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedOp}
            onChange={(e) => setSelectedOp(e.target.value)}
            className="erp-filter-select"
          >
            <option value="all">{STRINGS.operations.filterOpAll}</option>
            <option value="expo">{STRINGS.operations.filterOpExpo}</option>
            <option value="impo">{STRINGS.operations.filterOpImpo}</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="erp-filter-select"
          >
            <option value="all">{STRINGS.operations.filterTypeAll}</option>
            <option value="maritime">{STRINGS.operations.filterTypeMaritime}</option>
            <option value="air">{STRINGS.operations.filterTypeAir}</option>
            <option value="land">{STRINGS.operations.filterTypeLand}</option>
          </select>

          {(searchQuery || selectedType !== 'all' || selectedOp !== 'all' || activeTab !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedOp('all');
                setActiveTab('all');
              }}
              className="text-xs underline cursor-pointer transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* DATA GRID TABLE */}
      <div className="erp-table-container" style={{ backgroundColor: 'var(--surface-base)', boxShadow: 'var(--shadow-card)' }}>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="erp-th">DO / Referencia</th>
                <th className="erp-th">Modo</th>
                <th className="erp-th">Exportador / Consignatario</th>
                <th className="erp-th">Ruta (Origen → Destino)</th>
                <th className="erp-th">Transportador / Ref</th>
                <th className="erp-th">ETD / ATD</th>
                <th className="erp-th">ETA / ATA</th>
                <th className="erp-th text-center">Días Libres</th>
                <th className="erp-th">Estado Operativo</th>
                <th className="erp-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
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
                  <td colSpan={10} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    No se encontraron cargas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => {
                  const overdue = isEtaOverdue(shipment.eta, shipment.current_status);
                  const freeDaysInfo = calculateFreeDaysRemaining(shipment.ata || shipment.eta, shipment.free_days);

                  return (
                    <tr
                      key={shipment.id}
                      className="erp-tr group"
                      onClick={() => navigate(`/shipments/${shipment.id}`)}
                    >
                      {/* DO / Operación */}
                      <td className="erp-td font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs" style={{ color: 'var(--brand-orange-text)' }}>
                            {shipment.do_number}
                          </span>
                        </div>
                      </td>

                      {/* Modo */}
                      <td className="erp-td whitespace-nowrap">
                        <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                          {renderTransportIcon(shipment.shipment_type)}
                          {shipment.shipment_type === 'air' ? (
                            <span className="capitalize">aéreo</span>
                          ) : shipment.shipment_type === 'maritime' ? (
                            <span className="capitalize">marítimo</span>
                          ) : (
                            <span className="capitalize">terrestre</span>
                          )}
                        </div>
                      </td>

                      {/* Exportador / Consignatario */}
                      <td className="erp-td max-w-[200px]">
                        <MarqueeText
                          text={shipment.consignee || '--'}
                          containerClassName="max-w-[180px]"
                          className="font-medium"
                        />
                        <div>
                          <MarqueeText
                            text={shipment.exporter ? `Exp: ${shipment.exporter}` : '--'}
                            containerClassName="max-w-[180px] text-[10px]"
                            style={{ color: 'var(--text-muted)' }}
                          />
                        </div>
                      </td>

                      {/* Ruta */}
                      <td className="erp-td whitespace-nowrap">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{shipment.origin || '--'}</div>
                        <div className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          → {shipment.destination || '--'}
                        </div>
                      </td>

                      {/* Carrier */}
                      <td className="erp-td max-w-[180px]">
                        <MarqueeText
                          text={shipment.carrier || '--'}
                          containerClassName="max-w-[160px]"
                          className="font-medium"
                        />
                        <div className="truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {shipment.container_number || shipment.air_waybill || shipment.flight_vessel || '--'}
                        </div>
                      </td>

                      {/* ETD / ATD */}
                      <td className="erp-td whitespace-nowrap">
                        <div style={{ color: 'var(--text-primary)' }}>{formatDateDisplay(shipment.etd)}</div>
                        {shipment.atd && (
                          <div className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium whitespace-nowrap">
                            ATD: {formatDateDisplay(shipment.atd)}
                          </div>
                        )}
                      </td>

                      {/* ETA / ATA */}
                      <td className="erp-td whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className={overdue ? 'text-rose-500 dark:text-rose-400 font-bold' : ''} style={!overdue ? { color: 'var(--text-primary)' } : {}}>
                            {formatDateDisplay(shipment.eta)}
                          </span>
                          {overdue && (
                            <span className="px-1.5 bg-rose-500/15 text-rose-500 dark:text-rose-300 border border-rose-500/30 rounded text-[9px] font-bold whitespace-nowrap">
                              DEMORA
                            </span>
                          )}
                        </div>
                        {shipment.ata && (
                          <div className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium whitespace-nowrap">
                            ATA: {formatDateDisplay(shipment.ata)}
                          </div>
                        )}
                      </td>

                      {/* Días Libres */}
                      <td className="erp-td text-center whitespace-nowrap">
                        {freeDaysInfo ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                              freeDaysInfo.isOverdue
                                ? 'bg-rose-500/15 text-rose-500 dark:text-rose-300 border border-rose-500/30'
                                : freeDaysInfo.isExpiringSoon
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {freeDaysInfo.isOverdue
                              ? `VENCIDO (${Math.abs(freeDaysInfo.remainingDays)}d)`
                              : `${freeDaysInfo.remainingDays} Días`}
                          </span>
                        ) : shipment.free_days ? (
                          <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{shipment.free_days} Días pactados</span>
                        ) : (
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>--</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="erp-td whitespace-nowrap">
                        <span className="erp-status-chip">
                          {getShipmentStatusLabel(shipment.current_status)}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="erp-td text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="erp-action-group">
                          <button
                            onClick={() => navigate(`/shipments/${shipment.id}`)}
                            title="Ver detalles completos del embarque"
                            className="erp-action-btn erp-action-btn-view"
                            aria-label="Ver detalles"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenQuickUpdate(shipment)}
                            title="Actualización rápida / Registrar novedad"
                            className="erp-action-btn erp-action-btn-edit"
                            aria-label="Actualización rápida"
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5" />
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
      {quickUpdateShipment &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="erp-modal-overlay" onClick={() => setQuickUpdateShipment(null)}>
            <div className="erp-modal w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            {/* Pinned Header */}
            <div className="erp-modal-header">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                     style={{ backgroundColor: 'var(--brand-orange-dim)', color: 'var(--brand-orange)' }}>
                  DO
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    Actualización Rápida: {quickUpdateShipment.do_number}
                  </h3>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {quickUpdateShipment.consignee || quickUpdateShipment.exporter}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickUpdateShipment(null)}
                className="erp-icon-btn shrink-0"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickUpdate} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="erp-modal-body space-y-4">
                {updateError && (
                  <div className="erp-badge-danger w-full p-3 rounded-xl justify-start text-xs">
                    {updateError}
                  </div>
                )}

                <div>
                  <label className="erp-label">Nuevo Estado Operativo</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="erp-select">
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
                  <label className="erp-label">Ubicación actual (Opcional)</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Ej: Puerto de Buenaventura, Bodega Cartagena"
                    className="erp-input"
                  />
                </div>

                <div>
                  <label className="erp-label">Observación o Novedad</label>
                  <textarea
                    rows={3}
                    value={newObservation}
                    onChange={(e) => setNewObservation(e.target.value)}
                    placeholder="Escribe el reporte o novedad de la operación..."
                    className="erp-textarea"
                  />
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="erp-modal-footer">
                <button type="button" onClick={() => setQuickUpdateShipment(null)} className="erp-btn-secondary px-4 py-2">
                  Cancelar
                </button>
                <button type="submit" disabled={savingUpdate} className="erp-btn-primary px-4 py-2">
                  {savingUpdate ? 'Guardando...' : 'Guardar Actualización'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
