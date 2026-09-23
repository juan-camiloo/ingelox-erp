import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  FileText,
  Clock,
  Building,
  Upload,
  Download,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  MessageSquare,
  FileCheck,
  Mail,
  Copy
} from 'lucide-react';
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
    const body = encodeURIComponent(`Estimado cliente,\n\nSe adjunta el reporte oficial de estado para el expediente DO #${shipment.do_number}.\n\nOrigen: ${shipment.origin}\nDestino: ${shipment.destination}\nLínea/Naviera: ${shipment.carrier || '--'}\nEstado actual: ${getShipmentStatusLabel(shipment.current_status)}\nETA: ${formatDateDisplay(shipment.eta)}\n\nSaludos cordiales,\nIngelox Logistics SAS\nCentro Operativo de Tráfico`);
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
        shipment_type: sData.shipment_type || 'maritime',
        current_status: sData.current_status || '',
        exporter: sData.exporter || '',
        consignee: sData.consignee || '',
        origin: sData.origin || '',
        destination: sData.destination || '',
        carrier: sData.carrier || '',
        flight_vessel: sData.flight_vessel || '',
        air_waybill: sData.air_waybill || '',
        container_number: sData.container_number || '',
        incoterm: sData.incoterm || 'FOB',
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

      // Si el estado cambió, registrar en novedades
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

      setSuccessMessage('Expediente actualizado exitosamente.');
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

      // Upload to supabase storage bucket 'documents'
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });

      if (uploadErr) throw uploadErr;

      // Insert record in documents table
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
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        <span className="text-xs">Cargando expediente de tráfico...</span>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="py-20 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Expediente no encontrado</h2>
        <button
          onClick={() => navigate('/operations')}
          className="text-xs text-brand-orange hover:underline"
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/operations')}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-mono">{shipment.do_number}</h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  opType === 'expo'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {opType === 'expo' ? 'Exportación' : 'Importación'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {getShipmentStatusLabel(shipment.current_status)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {shipment.consignee || shipment.exporter || 'Sin cliente asignado'} • {shipment.origin} → {shipment.destination}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-orange/20 transition-all cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-brand-orange" />
                <span>Novedad</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>Emitir Reporte</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Expediente</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Left = Details/Form, Right = Timeline & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Data Details (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-brand-orange">
                <FileText className="w-4 h-4" /> Especificaciones de Carga y Ruta
              </h2>
              {isEditing && (
                <span className="text-[10px] text-brand-orange font-semibold bg-brand-orange/10 px-2 py-0.5 rounded">
                  Modo Edición Activo
                </span>
              )}
            </div>

            {isEditing ? (
              /* EDIT MODE FORM */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">DO / Referencia</label>
                  <input
                    type="text"
                    value={formData.do_number}
                    onChange={(e) => setFormData({ ...formData, do_number: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Modo de Transporte</label>
                  <select
                    value={formData.shipment_type}
                    onChange={(e) => setFormData({ ...formData, shipment_type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="maritime">Marítimo</option>
                    <option value="air">Aéreo</option>
                    <option value="land">Terrestre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Estado Operativo</label>
                  <select
                    value={formData.current_status}
                    onChange={(e) => setFormData({ ...formData, current_status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {statusOptions.map((st) => (
                      <option key={st.value} value={st.value}>
                        Paso {st.step}: {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Incoterm</label>
                  <select
                    value={formData.incoterm}
                    onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {INCOTERMS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Exportador</label>
                  <input
                    type="text"
                    value={formData.exporter}
                    onChange={(e) => setFormData({ ...formData, exporter: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Consignatario</label>
                  <input
                    type="text"
                    value={formData.consignee}
                    onChange={(e) => setFormData({ ...formData, consignee: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Origen</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Destino</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Línea / Naviera</label>
                  <input
                    type="text"
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Motonave / Vuelo</label>
                  <input
                    type="text"
                    value={formData.flight_vessel}
                    onChange={(e) => setFormData({ ...formData, flight_vessel: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Guía / Booking / Master</label>
                  <input
                    type="text"
                    value={formData.air_waybill}
                    onChange={(e) => setFormData({ ...formData, air_waybill: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Contenedor(es)</label>
                  <input
                    type="text"
                    value={formData.container_number}
                    onChange={(e) => setFormData({ ...formData, container_number: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">ETD (Estimada Salida)</label>
                  <input
                    type="date"
                    value={formData.etd}
                    onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">ETA (Estimada Llegada)</label>
                  <input
                    type="date"
                    value={formData.eta}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">ATD (Real Salida)</label>
                  <input
                    type="datetime-local"
                    value={formData.atd}
                    onChange={(e) => setFormData({ ...formData, atd: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">ATA (Real Llegada)</label>
                  <input
                    type="datetime-local"
                    value={formData.ata}
                    onChange={(e) => setFormData({ ...formData, ata: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Cutoff Documental</label>
                  <input
                    type="datetime-local"
                    value={formData.documentary_cutoff}
                    onChange={(e) => setFormData({ ...formData, documentary_cutoff: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Días Libres Pactados</label>
                  <input
                    type="number"
                    value={formData.free_days}
                    onChange={(e) => setFormData({ ...formData, free_days: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tipo de Carga</label>
                  <select
                    value={formData.cargo_type}
                    onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {CARGO_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Inspección Aduanera</label>
                  <select
                    value={formData.inspection_status}
                    onChange={(e) => setFormData({ ...formData, inspection_status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {INSPECTION_STATUSES.map((is) => (
                      <option key={is.value} value={is.value}>{is.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              /* READ VIEW GRID */
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Exportador</span>
                  <span className="text-white font-semibold text-sm">{shipment.exporter || '--'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Consignatario</span>
                  <span className="text-white font-semibold text-sm">{shipment.consignee || '--'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Ruta de Transporte</span>
                  <span className="text-white font-medium">{shipment.origin} → {shipment.destination}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Línea / Naviera</span>
                  <span className="text-white font-medium">{shipment.carrier || '--'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Motonave / Vuelo</span>
                  <span className="text-white font-medium">{shipment.flight_vessel || '--'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Guía / Booking</span>
                  <span className="text-white font-medium font-mono">{shipment.air_waybill || '--'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Contenedor(es)</span>
                  <span className="text-white font-medium font-mono">{shipment.container_number || '--'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Incoterm & Carga</span>
                  <span className="text-white font-medium">{shipment.incoterm || '--'} • {shipment.cargo_type || '--'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Días Libres de Almacén</span>
                  <span className="text-white font-medium">
                    {freeDaysInfo ? (
                      <span className={freeDaysInfo.isOverdue ? 'text-rose-400 font-bold' : freeDaysInfo.isExpiringSoon ? 'text-amber-400' : 'text-emerald-400'}>
                        {freeDaysInfo.remainingDays} días restantes ({shipment.free_days} pactados)
                      </span>
                    ) : shipment.free_days ? (
                      `${shipment.free_days} días`
                    ) : (
                      '--'
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-slate-400 block mb-0.5">ETD (Estimada Salida)</span>
                  <span className="text-white font-medium">{formatDateDisplay(shipment.etd)}</span>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-slate-400 block mb-0.5">ETA (Estimada Llegada)</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-medium ${overdue ? 'text-rose-400 font-bold' : 'text-white'}`}>
                      {formatDateDisplay(shipment.eta)}
                    </span>
                    {overdue && (
                      <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-bold">
                        VENCIDO
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-slate-400 block mb-0.5">ATD (Real Salida)</span>
                  <span className="text-white font-medium">{formatDateTimeDisplay(shipment.atd)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">ATA (Real Llegada)</span>
                  <span className="text-white font-medium">{formatDateTimeDisplay(shipment.ata)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Cutoff Documental</span>
                  <span className="text-white font-medium">{formatDateTimeDisplay(shipment.documentary_cutoff)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Inspección Aduanera</span>
                  <span className="text-white font-medium capitalize">{shipment.inspection_status || 'Sin inspección'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Companies Assignment Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-brand-orange">
                <Building className="w-4 h-4" /> Empresas Asociadas al Expediente
              </h2>
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-1 text-xs text-brand-orange hover:text-orange-400 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Vincular Empresa
              </button>
            </div>

            {assignedCompanies.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Ninguna empresa está vinculada a esta carga. Los clientes de empresas asignadas podrán verla en su portal.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assignedCompanies.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{comp.name}</div>
                      <div className="text-[10px] text-slate-400">NIT: {comp.nit || 'N/A'}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveCompany(comp.id)}
                      title="Desvincular empresa"
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
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
        <div className="space-y-6">
          {/* DIGITAL DOCUMENTS VAULT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-brand-orange">
                <FileCheck className="w-4 h-4" /> Expediente Digital ({documents.length})
              </h2>
              <label className="flex items-center gap-1.5 px-3 py-1 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all">
                {uploadingDoc ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Subir Doc</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingDoc}
                  className="hidden"
                />
              </label>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                No hay documentos subidos para este DO.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-2 hover:bg-slate-800 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-200 truncate" title={doc.file_name}>
                        {doc.file_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {Math.round(doc.file_size / 1024)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadDoc(doc)}
                        title="Ver / Descargar"
                        className="p-1 rounded text-slate-400 hover:text-brand-orange"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc)}
                        title="Eliminar"
                        className="p-1 rounded text-slate-400 hover:text-rose-400"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-brand-orange">
                <Clock className="w-4 h-4" /> Historial de Novedades ({updates.length})
              </h2>
              <button
                onClick={() => setShowAddUpdate(true)}
                className="text-xs text-brand-orange hover:text-orange-400 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Reportar
              </button>
            </div>

            {updates.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Sin eventos u observaciones registradas.
              </p>
            ) : (
              <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {updates.map((upd) => (
                  <div key={upd.id} className="relative group text-xs">
                    <div className="absolute -left-4 top-1.5 w-2 h-2 rounded-full bg-brand-orange ring-4 ring-slate-900" />
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-brand-orange">
                          {getShipmentStatusLabel(upd.status)}
                        </span>
                        <span>{formatDateTimeDisplay(upd.created_at)}</span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed">{upd.observation || upd.description || '--'}</p>
                      {upd.location && (
                        <div className="text-[10px] text-slate-400 italic">
                          📍 {upd.location}
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
      {showAddUpdate && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddUpdate(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-orange" /> Registrar Novedad de Tráfico
            </h3>
            <form onSubmit={handleAddUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cambiar Estado Operativo (Opcional)
                </label>
                <select
                  value={newUpdateStatus}
                  onChange={(e) => setNewUpdateStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ubicación actual
                </label>
                <input
                  type="text"
                  value={newUpdateLocation}
                  onChange={(e) => setNewUpdateLocation(e.target.value)}
                  placeholder="Ej: Patio de Contenedores Cartagena"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descripción del Evento *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newUpdateDesc}
                  onChange={(e) => setNewUpdateDesc(e.target.value)}
                  placeholder="Detalla el hito alcanzado, novedades de la naviera, inspección o retraso..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUpdate(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingNewUpdate}
                  className="px-4 py-2 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-orange/20"
                >
                  {savingNewUpdate ? 'Registrando...' : 'Registrar Novedad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN COMPANY */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-brand-orange" /> Vincular Empresa a la Carga
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Selecciona la Empresa
                </label>
                <select
                  value={selectedCompanyToAssign}
                  onChange={(e) => setSelectedCompanyToAssign(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  <option value="">Selecciona una empresa...</option>
                  {allCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.nit ? `(${c.nit})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAssignCompany}
                  disabled={!selectedCompanyToAssign}
                  className="px-4 py-2 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-orange/20"
                >
                  Vincular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSTITUTIONAL EMAIL REPORT PREVIEW */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-orange/20 text-brand-orange flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reporte Operativo Institucional</h3>
                  <p className="text-xs text-slate-400">
                    Plantilla oficial Ingelox ERP • DO #{shipment.do_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Box */}
            <div className="flex-1 p-5 overflow-y-auto bg-slate-950 custom-scrollbar">
              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
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
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                {copiedStatus === 'html' ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ¡Código HTML copiado al portapapeles!
                  </span>
                ) : (
                  <span>Diseño exclusivo para operaciones corporativas.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyHtmlReport}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar HTML</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenMailClient}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-orange/20 transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Abrir en Correo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
