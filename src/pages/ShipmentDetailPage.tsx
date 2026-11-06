import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  FileText,
  Clock,
  Building,
  Download,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  MessageSquare,
  FileCheck,
  Mail,
  Copy,
  Building2,
  Plane,
} from 'lucide-react';
import { PreviewPill } from '../components/common/PreviewPill';
import { supabase } from '../lib/supabase';
import type {
  Shipment,
  ShipmentUpdate,
  DocumentRecord,
  Company,
} from '../types/shipment';
import {
  STATUS_OPTIONS_BY_OPERATION,
  getShipmentStatusLabel,
  inferShipmentOperationType,
  INCOTERMS,
  CARGO_TYPES,
  INSPECTION_STATUSES
} from '../types/shipment';
import {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatIsoToLocalDateInput,
  formatIsoToLocalDateTimeInput,
  serializeDateForDb,
  serializeDateTimeForDb,
  isEtaOverdue,
  calculateFreeDaysRemaining
} from '../lib/dateUtils';
import { generateOperationalUpdateEmail } from '../lib/emailTemplates';
import { useAuth } from '../context/AuthContext';

export const ShipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [updates, setUpdates] = useState<ShipmentUpdate[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [assignedCompanies, setAssignedCompanies] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit form state
  const [formData, setFormData] = useState<any>({});

  // New update modal/form
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [newUpdateStatus, setNewUpdateStatus] = useState('');
  const [newUpdateDesc, setNewUpdateDesc] = useState('');
  const [newUpdateLocation, setNewUpdateLocation] = useState('');
  const [savingNewUpdate, setSavingNewUpdate] = useState(false);

  // Document upload state
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCompanyToAssign, setSelectedCompanyToAssign] = useState('');

  // Email report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  const handleCopyHtmlReport = () => {
    if (!shipment) return;
    const latestUpdate = updates[0] || { status: shipment.current_status || 'activo', description: 'Operación activa en curso' };
    const html = generateOperationalUpdateEmail(shipment, latestUpdate, { recipientName: shipment.consignee || 'Cliente' });
    navigator.clipboard.writeText(html);
    setCopiedStatus('html');
    setTimeout(() => setCopiedStatus(null), 3000);
  };

  const handleOpenMailClient = () => {
    if (!shipment) return;
    const subject = encodeURIComponent(`[INGELOX OPERACIONES] Reporte de Tráfico DO #${shipment.do_number} - ${shipment.consignee || ''}`);
    const body = encodeURIComponent(`Estimado cliente,\n\nSe adjunta el reporte oficial de estado para el expediente DO #${shipment.do_number}.\n\nOrigen: ${shipment.origin}\nDestino: ${shipment.destination}\nTransportador: ${shipment.carrier || '--'}\nEstado actual: ${getShipmentStatusLabel(shipment.current_status)}\nETA: ${formatDateDisplay(shipment.eta)}\n\nSaludos cordiales,\nIngelox Logistics SAS\nCentro Operativo de Tráfico`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const loadShipmentData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMessage(null);

      // 1. Fetch shipment
      const { data: sData, error: sError } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single();

      if (sError) throw sError;
      setShipment(sData as Shipment);

      // Initialize edit form
      setFormData({
        do_number: sData.do_number || '',
        shipment_type: sData.shipment_type || '',
        current_status: sData.current_status || '',
        exporter: sData.exporter || '',
        consignee: sData.consignee || '',
        origin: sData.origin || '',
        destination: sData.destination || '',
        carrier: sData.carrier || '',
        flight_vessel: sData.flight_vessel || '',
        air_waybill: sData.air_waybill || '',
        container_number: sData.container_number || '',
        incoterm: sData.incoterm || '',
        cargo_type: sData.cargo_type || 'general',
        free_days: sData.free_days !== null ? String(sData.free_days) : '',
        inspection_status: sData.inspection_status || 'none',
        etd: formatIsoToLocalDateInput(sData.etd),
        eta: formatIsoToLocalDateInput(sData.eta),
        atd: formatIsoToLocalDateTimeInput(sData.atd),
        ata: formatIsoToLocalDateTimeInput(sData.ata),
        documentary_cutoff: formatIsoToLocalDateTimeInput(sData.documentary_cutoff),
      });

      // 2. Fetch updates history
      const { data: uData } = await supabase
        .from('shipment_updates')
        .select('*')
        .eq('shipment_id', id)
        .order('created_at', { ascending: false });

      setUpdates((uData as ShipmentUpdate[]) || []);

      // 3. Fetch documents
      const { data: dData } = await supabase
        .from('documents')
        .select('*')
        .eq('shipment_id', id)
        .order('created_at', { ascending: false });

      setDocuments((dData as DocumentRecord[]) || []);

      // 4. Fetch assigned companies
      const { data: cAssignments } = await supabase
        .from('company_shipment')
        .select('company_id, companies(*)')
        .eq('shipment_id', id);

      if (cAssignments) {
        const comps = cAssignments.map((ca: any) => ca.companies).filter(Boolean);
        setAssignedCompanies(comps);
      }

      // 5. Fetch all companies for assignment dropdown
      const { data: compsAll } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      setAllCompanies((compsAll as Company[]) || []);

    } catch (err: any) {
      console.error('Error loading shipment detail:', err);
      setErrorMessage(err.message || 'Error al cargar los detalles de la carga');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipmentData();
  }, [id]);

  const handleSaveEdit = async () => {
    if (!id || !shipment) return;
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const nowIso = new Date().toISOString();
      const payload: any = {
        do_number: formData.do_number.trim().toUpperCase(),
        shipment_type: formData.shipment_type,
        current_status: formData.current_status,
        exporter: formData.exporter.trim() || null,
        consignee: formData.consignee.trim() || null,
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        carrier: formData.carrier.trim() || null,
        flight_vessel: formData.flight_vessel.trim() || null,
        air_waybill: formData.air_waybill.trim() || null,
        container_number: formData.container_number.trim().toUpperCase() || null,
        incoterm: formData.incoterm || null,
        cargo_type: formData.cargo_type || null,
        free_days: formData.free_days ? parseInt(formData.free_days, 10) : null,
        inspection_status: formData.inspection_status || null,
        etd: serializeDateForDb(formData.etd),
        eta: serializeDateForDb(formData.eta),
        atd: serializeDateTimeForDb(formData.atd),
        ata: serializeDateTimeForDb(formData.ata),
        documentary_cutoff: serializeDateTimeForDb(formData.documentary_cutoff),
        updated_by: profile?.id,
        updated_at: nowIso,
      };

      const { error: updErr } = await supabase
        .from('shipments')
        .update(payload)
        .eq('id', id);

      if (updErr) throw updErr;

      if (formData.current_status !== shipment.current_status) {
        await supabase.from('shipment_updates').insert({
          shipment_id: id,
          status: formData.current_status,
          observation: `Estado actualizado a ${getShipmentStatusLabel(formData.current_status)}`,
          updated_by: profile?.id,
          event_type: 'status_update',
          created_at: nowIso,
        });
      }

      setSuccessMessage('Carga actualizada exitosamente.');
      setIsEditing(false);
      await loadShipmentData();
    } catch (err: any) {
      console.error('Error saving shipment edit:', err);
      setErrorMessage(err.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newUpdateDesc.trim()) return;
    setSavingNewUpdate(true);

    try {
      const nowIso = new Date().toISOString();
      const statusToUse = newUpdateStatus || shipment?.current_status || 'update';

      const { error: insErr } = await supabase
        .from('shipment_updates')
        .insert({
          shipment_id: id,
          status: statusToUse,
          observation: newUpdateDesc.trim(),
          location: newUpdateLocation.trim() || null,
          updated_by: profile?.id,
          event_type: 'status_update',
          created_at: nowIso,
        });

      if (insErr) throw insErr;

      if (newUpdateStatus && newUpdateStatus !== shipment?.current_status) {
        await supabase
          .from('shipments')
          .update({
            current_status: newUpdateStatus,
            updated_at: nowIso,
            updated_by: profile?.id,
          })
          .eq('id', id);
      }

      setShowAddUpdate(false);
      setNewUpdateDesc('');
      setNewUpdateLocation('');
      await loadShipmentData();
    } catch (err: any) {
      console.error('Error adding update:', err);
      setErrorMessage(err.message || 'Error al agregar la novedad');
    } finally {
      setSavingNewUpdate(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      setUploadingDoc(true);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${id}/${Date.now()}_${sanitizedName}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });

      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase
        .from('documents')
        .insert({
          shipment_id: id,
          file_name: file.name,
          file_size: file.size,
          storage_path: uploadData.path,
          file_path: uploadData.path,
          created_by: profile?.id,
        });

      if (dbErr) throw dbErr;

      await loadShipmentData();
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setErrorMessage(err.message || 'Error al subir el documento');
    } finally {
      setUploadingDoc(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDownloadDoc = async (doc: DocumentRecord) => {
    try {
      const path = doc.storage_path || doc.file_path;
      if (!path) return;
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 3600);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Error getting download URL:', err);
      alert('No se pudo generar el enlace de descarga.');
    }
  };

  const handleDeleteDoc = async (doc: DocumentRecord) => {
    if (!confirm(`¿Eliminar documento "${doc.file_name}"?`)) return;
    try {
      const path = doc.storage_path || doc.file_path;
      if (path) {
        await supabase.storage.from('documents').remove([path]);
      }
      await supabase.from('documents').delete().eq('id', doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      console.error('Error deleting document:', err);
    }
  };

  const handleAssignCompany = async () => {
    if (!selectedCompanyToAssign || !id) return;
    try {
      const { error } = await supabase
        .from('company_shipment')
        .insert({
          company_id: selectedCompanyToAssign,
          shipment_id: id,
        });

      if (error) throw error;
      setShowAssignModal(false);
      setSelectedCompanyToAssign('');
      await loadShipmentData();
    } catch (err: any) {
      console.error('Error assigning company:', err);
      alert(err.message || 'Error al asignar empresa');
    }
  };

  const handleRemoveCompany = async (companyId: string) => {
    if (!confirm('¿Desvincular esta empresa de la carga?')) return;
    try {
      await supabase
        .from('company_shipment')
        .delete()
        .eq('shipment_id', id)
        .eq('company_id', companyId);
      setAssignedCompanies((prev) => prev.filter((c) => c.id !== companyId));
    } catch (err: any) {
      console.error('Error removing company assignment:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-orange)' }} />
        <span>Cargando expediente de tráfico...</span>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="py-20 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 mx-auto" style={{ color: 'var(--color-danger)' }} />
        <h2 className="erp-page-title text-lg">Carga no encontrada</h2>
        <button
          onClick={() => navigate('/operations')}
          className="erp-btn-ghost text-xs"
          style={{ color: 'var(--brand-orange-text)' }}
        >
          Volver a Operaciones
        </button>
      </div>
    );
  }

  const opType = inferShipmentOperationType(shipment.do_number) || 'expo';
  const statusOptions = STATUS_OPTIONS_BY_OPERATION[opType];
  const overdue = isEtaOverdue(shipment.eta, shipment.current_status);
  const freeDaysInfo = calculateFreeDaysRemaining(shipment.ata || shipment.eta, shipment.free_days);

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
      {/* Header bar */}
      <div className="erp-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/operations')}
            className="erp-btn-secondary p-2"
            aria-label="Volver a Control de Tráfico"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="erp-page-title font-mono">{shipment.do_number}</h1>
              <span className={opType === 'expo' ? 'erp-badge-blue' : 'erp-badge-emerald'}>
                {opType === 'expo' ? 'Exportación' : 'Importación'}
              </span>
              <span className="erp-badge-slate">
                {getShipmentStatusLabel(shipment.current_status)}
              </span>

              <PreviewPill
                label={`${assignedCompanies.length} ${assignedCompanies.length === 1 ? 'Empresa' : 'Empresas'}`}
                icon={Building2}
                variant="orange"
                title="Empresas con Acceso al Portal"
                subtitle={`DO: ${shipment.do_number}`}
                modalTitle={`Empresas Vinculadas — ${shipment.do_number}`}
                emptyMessage="No hay empresas vinculadas a este embarque."
                items={assignedCompanies.map((c) => ({
                  id: c.id,
                  title: c.name,
                  subtitle: c.nit ? `NIT: ${c.nit}` : undefined,
                  icon: Building2,
                  badge: { text: 'Portal', variant: 'blue' },
                  onClick: () => navigate(`/clients?search=${encodeURIComponent(c.name)}`),
                }))}
              />

              <PreviewPill
                label={`${documents.length} ${documents.length === 1 ? 'Doc' : 'Docs'}`}
                icon={FileText}
                variant="slate"
                title="Bóveda de Documentos"
                subtitle={`DO: ${shipment.do_number}`}
                modalTitle={`Documentos Digitales — ${shipment.do_number}`}
                emptyMessage="No hay documentos subidos en este embarque."
                items={documents.map((d) => ({
                  id: d.id,
                  title: d.file_name,
                  subtitle: `${(d.file_size / 1024).toFixed(1)} KB`,
                  meta: d.created_at ? new Date(d.created_at).toLocaleDateString('es-CO') : undefined,
                  icon: FileText,
                  badge: { text: d.file_name.split('.').pop()?.toUpperCase() || 'FILE', variant: 'slate' },
                }))}
              />
            </div>
            <p className="erp-page-subtitle">
              {shipment.consignee || shipment.exporter || 'Sin cliente asignado'} • {shipment.origin} → {shipment.destination}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="erp-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="erp-btn-primary"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowAddUpdate(true)}
                className="erp-btn-secondary"
              >
                <Plus className="w-3.5 h-3.5" style={{ color: 'var(--brand-orange)' }} />
                <span>Novedad</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="erp-btn-secondary"
              >
                <Mail className="w-3.5 h-3.5" style={{ color: 'var(--color-info)' }} />
                <span>Emitir Reporte</span>
              </button>
              {shipment.shipment_type === 'air' && (
                <button
                  type="button"
                  onClick={() => navigate(`/awb/new?shipmentId=${shipment.id}`)}
                  className="erp-btn-secondary"
                  title="Generar Guía Aérea (AWB)"
                >
                  <Plane className="w-3.5 h-3.5 text-[#ff6600]" />
                  <span>Generar AWB</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="erp-btn-primary"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar carga</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="erp-badge-danger w-full p-3.5 rounded-xl justify-start text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="erp-badge-emerald w-full p-3.5 rounded-xl justify-start text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Left = Details/Form, Right = Timeline & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* LEFT COLUMN: Data Details (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* General Information Card */}
          <div className="erp-card space-y-4">
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--brand-orange-text)' }}>
                <FileText className="w-4 h-4" /> Especificaciones de Carga y Ruta
              </h2>
              {isEditing && (
                <span className="erp-badge-orange text-[10px]">
                  Modo Edición Activo
                </span>
              )}
            </div>

            {isEditing ? (
              /* EDIT MODE FORM */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="erp-label">DO / Referencia</label>
                  <input
                    type="text"
                    value={formData.do_number}
                    onChange={(e) => setFormData({ ...formData, do_number: e.target.value })}
                    className="erp-input font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="erp-label">Modo de Transporte</label>
                  <select
                    value={formData.shipment_type}
                    onChange={(e) => setFormData({ ...formData, shipment_type: e.target.value })}
                    className="erp-select"
                  >
                    <option value="maritime">Marítimo</option>
                    <option value="air">Aéreo</option>
                    <option value="land">Terrestre</option>
                  </select>
                </div>

                <div>
                  <label className="erp-label">Estado Operativo</label>
                  <select
                    value={formData.current_status}
                    onChange={(e) => setFormData({ ...formData, current_status: e.target.value })}
                    className="erp-select"
                  >
                    {statusOptions.map((st) => (
                      <option key={st.value} value={st.value}>
                        Paso {st.step}: {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="erp-label">Incoterm</label>
                  <select
                    value={formData.incoterm}
                    onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                    className="erp-select font-mono"
                  >
                    {INCOTERMS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="erp-label">Exportador</label>
                  <input
                    type="text"
                    value={formData.exporter}
                    onChange={(e) => setFormData({ ...formData, exporter: e.target.value })}
                    className="erp-input"
                  />
                </div>

                <div>
                  <label className="erp-label">Consignatario</label>
                  <input
                    type="text"
                    value={formData.consignee}
                    onChange={(e) => setFormData({ ...formData, consignee: e.target.value })}
                    className="erp-input"
                  />
                </div>

                <div>
                  <label className="erp-label">Origen</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="erp-input"
                  />
                </div>

                <div>
                  <label className="erp-label">Destino</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="erp-input"
                  />
                </div>

                <div>
                  <label className="erp-label">Transportador</label>
                  <input
                    type="text"
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    className="erp-input"
                  />
                </div>

                <div>
                  <label className="erp-label">Motonave / Vuelo / Placa</label>
                  <input
                    type="text"
                    value={formData.flight_vessel}
                    onChange={(e) => setFormData({ ...formData, flight_vessel: e.target.value })}
                    className="erp-input"
                  />
                </div>

                <div>
                  <label className="erp-label">Documento de Transporte / Booking</label>
                  <input
                    type="text"
                    value={formData.air_waybill}
                    onChange={(e) => setFormData({ ...formData, air_waybill: e.target.value })}
                    className="erp-input font-mono"
                  />
                </div>

                <div>
                  <label className="erp-label">Contenedor(es)</label>
                  <input
                    type="text"
                    value={formData.container_number}
                    onChange={(e) => setFormData({ ...formData, container_number: e.target.value })}
                    className="erp-input font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="erp-label">ETD</label>
                  <input
                    type="date"
                    value={formData.etd}
                    onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                    className="erp-input font-mono"
                  />
                </div>

                <div>
                  <label className="erp-label">ETA</label>
                  <input
                    type="date"
                    value={formData.eta}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                    className="erp-input font-mono"
                  />
                </div>

                <div>
                  <label className="erp-label">ATD</label>
                  <input
                    type="datetime-local"
                    value={formData.atd}
                    onChange={(e) => setFormData({ ...formData, atd: e.target.value })}
                    className="erp-input font-mono"
                  />
                </div>

                <div>
                  <label className="erp-label">ATA</label>
                  <input
                    type="datetime-local"
                    value={formData.ata}
                    onChange={(e) => setFormData({ ...formData, ata: e.target.value })}
                    className="erp-input font-mono"
                  />
                </div>

                <div>
                  <label className="erp-label">Cutoff Documental</label>
                  <input
                    type="datetime-local"
                    value={formData.documentary_cutoff}
                    onChange={(e) => setFormData({ ...formData, documentary_cutoff: e.target.value })}
                    className="erp-input font-mono"
                  />
                </div>

                <div>
                  <label className="erp-label">Días Libres</label>
                  <input
                    type="number"
                    value={formData.free_days}
                    onChange={(e) => setFormData({ ...formData, free_days: e.target.value })}
                    className="erp-input font-mono"
                  />
                </div>

                <div>
                  <label className="erp-label">Tipo de Carga</label>
                  <select
                    value={formData.cargo_type}
                    onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
                    className="erp-select"
                  >
                    {CARGO_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="erp-label">Inspección Aduanera</label>
                  <select
                    value={formData.inspection_status}
                    onChange={(e) => setFormData({ ...formData, inspection_status: e.target.value })}
                    className="erp-select"
                  >
                    {INSPECTION_STATUSES.map((is) => (
                      <option key={is.value} value={is.value}>{is.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              /* READ VIEW GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
                <div>
                  <span className="erp-label mb-0.5">Exportador</span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {shipment.exporter || '--'}
                  </span>
                </div>

                <div>
                  <span className="erp-label mb-0.5">Consignatario</span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {shipment.consignee || '--'}
                  </span>
                </div>

                <div>
                  <span className="erp-label mb-0.5">Ruta de Transporte</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {shipment.origin} → {shipment.destination}
                  </span>
                </div>

                <div>
                  <span className="erp-label mb-0.5">Transportador</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {shipment.carrier || '--'}
                  </span>
                </div>

                <div>
                  <span className="erp-label mb-0.5">Motonave / Vuelo / Placa</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {shipment.flight_vessel || '--'}
                  </span>
                </div>

                <div>
                  <span className="erp-label mb-0.5">Documento de Transporte / Booking</span>
                  <span className="font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
                    {shipment.air_waybill || '--'}
                  </span>
                </div>

                <div>
                  <span className="erp-label mb-0.5">Contenedor(es)</span>
                  <span className="font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
                    {shipment.container_number || '--'}
                  </span>
                </div>

                <div>
                  <span className="erp-label mb-0.5">Incoterm & Carga</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {shipment.incoterm || '--'} • {shipment.cargo_type || '--'}
                  </span>
                </div>

                <div>
                  <span className="erp-label mb-0.5">Días Libres</span>
                  <span className="font-medium">
                    {freeDaysInfo ? (
                      <span style={{ color: freeDaysInfo.isOverdue ? 'var(--color-danger)' : freeDaysInfo.isExpiringSoon ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: freeDaysInfo.isOverdue ? 'bold' : 'normal' }}>
                        {freeDaysInfo.remainingDays} Días restantes ({shipment.free_days} pactados)
                      </span>
                    ) : shipment.free_days ? (
                      `${shipment.free_days} Días`
                    ) : (
                      '--'
                    )}
                  </span>
                </div>

                <div className="pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="erp-label mb-0.5">ETD</span>
                  <span className="font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
                    {formatDateDisplay(shipment.etd)}
                  </span>
                </div>

                <div className="pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="erp-label mb-0.5">ETA</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium font-mono" style={{ color: overdue ? 'var(--color-danger)' : 'var(--text-primary)', fontWeight: overdue ? 'bold' : 'normal' }}>
                      {formatDateDisplay(shipment.eta)}
                    </span>
                    {overdue && (
                      <span className="erp-badge-danger text-[9px] px-1.5 py-0.2">
                        VENCIDO
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="erp-label mb-0.5">ATD</span>
                  <span className="font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
                    {formatDateTimeDisplay(shipment.atd)}
                  </span>
                </div>

                <div>
                  <span className="erp-label mb-0.5">ATA</span>
                  <span className="font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
                    {formatDateTimeDisplay(shipment.ata)}
                  </span>
                </div>

                <div>
                  <span className="erp-label mb-0.5">Cutoff Documental</span>
                  <span className="font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
                    {formatDateTimeDisplay(shipment.documentary_cutoff)}
                  </span>
                </div>

                <div>
                  <span className="erp-label mb-0.5">Inspección Aduanera</span>
                  <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                    {shipment.inspection_status || 'Sin inspección'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Companies Assignment Section */}
          <div className="erp-card space-y-4">
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--brand-orange-text)' }}>
                <Building className="w-4 h-4" /> Empresas Asociadas a la carga
              </h2>
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="erp-btn-ghost text-xs font-semibold"
                style={{ color: 'var(--brand-orange-text)' }}
              >
                <Plus className="w-3.5 h-3.5" /> Vincular Empresa
              </button>
            </div>

            {assignedCompanies.length === 0 ? (
              <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                Ninguna empresa está vinculada a esta carga. Los clientes de empresas asignadas podrán verla en su portal.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assignedCompanies.map((comp) => (
                  <div
                    key={comp.id}
                    className="erp-card-subtle p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{comp.name}</div>
                      <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>NIT: {comp.nit || 'N/A'}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveCompany(comp.id)}
                      title="Desvincular empresa"
                      className="erp-icon-btn hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Digital Documents & Updates Timeline */}
        <div className="space-y-5 sm:space-y-6">
          {/* DIGITAL DOCUMENTS VAULT */}
          <div className="erp-card space-y-4">
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--brand-orange-text)' }}>
                <FileCheck className="w-4 h-4" /> Documentos ({documents.length})
              </h2>
              <label 
                className="erp-btn-ghost text-xs font-semibold" 
                style={{ color: 'var(--brand-orange-text)' }}>

                <Plus className="w-3.5 h-3.5" /> Subir

                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingDoc}
                  className="hidden"
                />
              </label>
            </div>

            {documents.length === 0 ? (
              <div
                className="text-center py-6 rounded-xl text-xs"
                style={{
                  border: '1px dashed var(--border-default)',
                  color: 'var(--text-muted)',
                }}
              >
                No hay documentos subidos para esta carga.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="erp-card-subtle p-2.5 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }} title={doc.file_name}>
                        {doc.file_name}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {Math.round(doc.file_size / 1024)} KB
                      </div>
                    </div>
                    <div className="erp-action-group">
                      <button
                        onClick={() => handleDownloadDoc(doc)}
                        title="Ver / Descargar documento"
                        className="erp-action-btn erp-action-btn-view"
                        aria-label="Descargar"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc)}
                        title="Eliminar documento adjunto"
                        className="erp-action-btn erp-action-btn-delete"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TIMELINE OF UPDATES / REPORTES */}
          <div className="erp-card space-y-4">
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--brand-orange-text)' }}>
                <Clock className="w-4 h-4" /> Historial de Novedades ({updates.length})
              </h2>
              <button
                onClick={() => setShowAddUpdate(true)}
                className="erp-btn-ghost text-xs font-semibold"
                style={{ color: 'var(--brand-orange-text)' }}
              >
                <Plus className="w-3.5 h-3.5" /> Reportar
              </button>
            </div>

            {updates.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
                Sin eventos u observaciones registradas.
              </p>
            ) : (
              <div
                className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5"
                style={{ '--tw-before-bg': 'var(--border-default)' } as any}
              >
                {updates.map((upd) => (
                  <div key={upd.id} className="relative group text-xs">
                    <div
                      className="absolute -left-4 top-1.5 w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: 'var(--brand-orange)',
                        boxShadow: '0 0 0 4px var(--surface-base)',
                      }}
                    />
                    <div className="erp-card-subtle p-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span className="font-semibold" style={{ color: 'var(--brand-orange-text)' }}>
                          {getShipmentStatusLabel(upd.status)}
                        </span>
                        <span>{formatDateTimeDisplay(upd.created_at)}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {upd.observation || upd.description || '--'}
                      </p>
                      {upd.location && (
                        <div className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>
                          {upd.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: ADD UPDATE / NOVEDAD */}
      {showAddUpdate &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="erp-modal-overlay" onClick={() => setShowAddUpdate(false)}>
            <div className="erp-modal w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="erp-modal-header">
                <h3 className="erp-page-title text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 shrink-0" style={{ color: 'var(--brand-orange)' }} />
                  Registrar Novedad de Tráfico
                </h3>
                <button
                  onClick={() => setShowAddUpdate(false)}
                  className="erp-icon-btn"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddUpdate} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="erp-modal-body space-y-4">
                  <div>
                    <label className="erp-label">
                      Cambiar Estado Operativo (Opcional)
                    </label>
                    <select
                      value={newUpdateStatus}
                      onChange={(e) => setNewUpdateStatus(e.target.value)}
                      className="erp-select"
                    >
                      <option value="">Mantener estado actual ({getShipmentStatusLabel(shipment.current_status)})</option>
                      {statusOptions.map((st) => (
                        <option key={st.value} value={st.value}>
                          Paso {st.step}: {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="erp-label">
                      Ubicación actual
                    </label>
                    <input
                      type="text"
                      value={newUpdateLocation}
                      onChange={(e) => setNewUpdateLocation(e.target.value)}
                      placeholder="Ej: Patio de Contenedores Cartagena"
                      className="erp-input"
                    />
                  </div>

                  <div>
                    <label className="erp-label">
                      Descripción del Evento *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={newUpdateDesc}
                      onChange={(e) => setNewUpdateDesc(e.target.value)}
                      placeholder="Detalla el hito alcanzado, novedades de la naviera, inspección o retraso..."
                      className="erp-textarea"
                    />
                  </div>
                </div>

                <div className="erp-modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowAddUpdate(false)}
                    className="erp-btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingNewUpdate}
                    className="erp-btn-primary"
                  >
                    {savingNewUpdate ? 'Registrando...' : 'Registrar Novedad'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL: ASSIGN COMPANY */}
      {/* MODAL: ASSIGN COMPANY */}
      {showAssignModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="erp-modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="erp-modal w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="erp-modal-header">
                <h3 className="erp-page-title text-base flex items-center gap-2">
                  <Building className="w-5 h-5 shrink-0" style={{ color: 'var(--brand-orange)' }} />
                  Vincular Empresa a la Carga
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="erp-icon-btn"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="erp-modal-body space-y-4">
                <div>
                  <label className="erp-label">
                    Selecciona la Empresa
                  </label>
                  <select
                    value={selectedCompanyToAssign}
                    onChange={(e) => setSelectedCompanyToAssign(e.target.value)}
                    className="erp-select"
                  >
                    <option value="">Selecciona una empresa...</option>
                    {allCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.nit ? `(${c.nit})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="erp-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="erp-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAssignCompany}
                  disabled={!selectedCompanyToAssign}
                  className="erp-btn-primary"
                >
                  Vincular
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL: INSTITUTIONAL EMAIL REPORT PREVIEW */}
      {showReportModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="erp-modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="erp-modal w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="erp-modal-header">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0"
                    style={{
                      backgroundColor: 'var(--brand-orange-dim)',
                      color: 'var(--brand-orange-text)',
                    }}
                  >
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="erp-page-title text-base">Reporte Operativo Institucional</h3>
                    <p className="erp-page-subtitle">
                      Plantilla oficial Ingelox ERP • DO #{shipment.do_number}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="erp-icon-btn"
                  aria-label="Cerrar vista previa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview Box */}
              <div className="erp-modal-body" style={{ backgroundColor: 'var(--surface-bg)' }}>
                <div className="rounded-xl overflow-hidden shadow-inner" style={{ border: '1px solid var(--border-default)' }}>
                  <iframe
                    title="Vista Previa de Correo"
                    srcDoc={generateOperationalUpdateEmail(
                      shipment,
                      updates[0] || { status: shipment.current_status || 'activo', description: 'Operación en tránsito y seguimiento' },
                      { recipientName: shipment.consignee || 'Cliente' }
                    )}
                    className="w-full h-[380px] bg-white border-0"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="erp-modal-footer flex-col sm:flex-row justify-between">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {copiedStatus === 'html' ? (
                    <span className="font-semibold flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> ¡Código HTML copiado al portapapeles!
                    </span>
                  ) : (
                    <span>Diseño exclusivo para operaciones corporativas.</span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleCopyHtmlReport}
                    className="erp-btn-secondary"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar HTML</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenMailClient}
                    className="erp-btn-primary"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Abrir en Correo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
