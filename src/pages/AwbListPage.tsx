import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plane,
  Plus,
  Search,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit,
  Eye,
  ArrowRight,
  Layers,
  X,
} from 'lucide-react';
import { AwbService } from '../services/awbService';
import type { AirWaybill, HouseAwb } from '../types/awb';
import { useAwbExcelGenerator } from '../hooks/useAwbExcelGenerator';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { buildAwbHtml } from '../templates/awbPdfTemplate';
import { STRINGS } from '../constants/strings';

export default function AwbListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [awbs, setAwbs] = useState<AirWaybill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'borrador' | 'emitida' | 'anulada'>('all');

  const { exportAwbToExcel, isExporting } = useAwbExcelGenerator();
  const { printHtml } = usePdfGenerator();

  // Preview modal state
  const [previewAwb, setPreviewAwb] = useState<AirWaybill | null>(null);
  const [previewHawb, setPreviewHawb] = useState<HouseAwb | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<string>('ORIGINAL 3 (FOR SHIPPER)');

  const loadAwbs = async () => {
    setLoading(true);
    try {
      const data = await AwbService.getAwbs();
      setAwbs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAwbs();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar este registro de Guía Aérea (AWB)?')) return;
    await AwbService.deleteAwb(id);
    loadAwbs();
  };

  const handleStatusChange = async (id: string, newStatus: 'borrador' | 'emitida' | 'anulada', e: React.MouseEvent) => {
    e.stopPropagation();
    await AwbService.updateAwbStatus(id, newStatus);
    loadAwbs();
  };

  const handlePrintPdf = (awb: AirWaybill, hawb?: HouseAwb, copy?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const copyToUse = copy || selectedCopy;
    const html = buildAwbHtml(awb, hawb, copyToUse);
    const title = hawb ? `HAWB_${hawb.hawb_number}` : `AWB_${awb.full_awb_number}`;
    printHtml(html, { title, orientation: 'portrait' });
  };

  const filteredAwbs = awbs.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      a.full_awb_number.toLowerCase().includes(q) ||
      a.airline_name.toLowerCase().includes(q) ||
      a.shipper_name.toLowerCase().includes(q) ||
      a.consignee_name.toLowerCase().includes(q) ||
      (a.do_number && a.do_number.toLowerCase().includes(q)) ||
      a.origin_airport_code.toLowerCase().includes(q) ||
      a.dest_airport_code.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="erp-page-title flex items-center gap-2">
            <Plane className="w-6 h-6 text-[#ff6600]" />
            {STRINGS.awb.title}
          </h1>
          <p className="erp-page-subtitle">
            {STRINGS.awb.subtitle}
          </p>
        </div>

        <button
          onClick={() => navigate('/awb/new')}
          className="erp-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{STRINGS.awb.newAwb}</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="erp-filter-bar flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['all', 'emitida', 'borrador', 'anulada'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                statusFilter === st ? 'erp-btn-primary' : 'erp-btn-secondary'
              }`}
            >
              {st === 'all' ? 'Todas' : st}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Buscar por guía, DO, remitente, ruta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="erp-input pl-9 text-xs"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="erp-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Cargando guías aéreas...
          </div>
        ) : filteredAwbs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Plane className="w-10 h-10 mx-auto text-muted opacity-40" />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              No se encontraron guías aéreas registradas
            </p>
            <button onClick={() => navigate('/awb/new')} className="erp-btn-primary mx-auto text-xs">
              <Plus className="w-4 h-4" />
              <span>Emitir Primera Guía</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>No. Guía</th>
                  <th>DO</th>
                  <th>Aerolínea / Ruta</th>
                  <th>Remitente & Consignatario</th>
                  <th>Tarifa</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAwbs.map((awb) => (
                  <tr
                    key={awb.id}
                    onClick={() => navigate(`/awb/new?id=${awb.id}`)}
                    className="cursor-pointer hover:bg-surface-raised transition-colors"
                  >
                    <td>
                      <div className="font-mono font-bold text-sm" style={{ color: 'var(--brand-orange-text)' }}>
                        {awb.full_awb_number}
                      </div>
                      {awb.hawbs && awb.hawbs.length > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                          <Layers className="w-3 h-3" />
                          {awb.hawbs.length} {awb.hawbs.length === 1 ? 'Guía Hija' : 'Guías Hijas'}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="erp-badge-slate font-mono text-xs">
                        {awb.do_number || 'SIN DO'}
                      </span>
                    </td>

                    <td>
                      <div className="font-semibold text-xs">{awb.airline_name}</div>
                      <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5 font-mono">
                        <span>{awb.origin_airport_code}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{awb.dest_airport_code}</span>
                        {awb.flight_number && <span className="ml-1 text-slate-400">({awb.flight_number})</span>}
                      </div>
                    </td>

                    <td>
                      <div className="font-medium text-xs truncate max-w-[180px]" title={awb.shipper_name}>
                        {awb.shipper_name}
                      </div>
                      <div className="text-[11px] text-muted truncate max-w-[180px]" title={awb.consignee_name}>
                        {awb.consignee_name || 'Sin consignatario'}
                      </div>
                    </td>

                    <td>
                      <div className="font-mono font-bold text-xs">
                        {awb.cargo.rate_charge_type === 'as_agreed'
                          ? 'AS AGREED'
                          : `${awb.currency} ${Number(awb.total_prepaid).toFixed(2)}`}
                      </div>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={awb.status}
                        onChange={(e) => handleStatusChange(awb.id, e.target.value as any, e as any)}
                        className={`text-xs py-1 px-2.5 rounded-full font-bold uppercase transition-all cursor-pointer ${
                          awb.status === 'emitida'
                            ? 'erp-badge-emerald'
                            : awb.status === 'anulada'
                            ? 'erp-badge-danger'
                            : 'erp-badge-orange'
                        }`}
                        style={{ border: 'none', outline: 'none' }}
                      >
                        <option value="borrador">Borrador</option>
                        <option value="emitida">Emitida</option>
                        <option value="anulada">Anulada</option>
                      </select>
                    </td>

                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Vista Previa PDF */}
                        <button
                          onClick={() => {
                            setPreviewAwb(awb);
                            setPreviewHawb(null);
                          }}
                          className="erp-icon-btn"
                          title="Vista Previa de Guía"
                          aria-label="Vista Previa"
                        >
                          <Eye className="w-4 h-4 text-sky-500" />
                        </button>

                        {/* Imprimir PDF */}
                        <button
                          onClick={() => handlePrintPdf(awb)}
                          className="erp-icon-btn"
                          title="Exportar PDF"
                          aria-label="Imprimir PDF"
                        >
                          <Printer className="w-4 h-4 text-indigo-500" />
                        </button>

                        {/* Exportar Excel */}
                        <button
                          onClick={() => exportAwbToExcel(awb)}
                          disabled={isExporting}
                          className="erp-icon-btn"
                          title="Exportar Excel"
                          aria-label="Exportar Excel"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => navigate(`/awb/new?id=${awb.id}`)}
                          className="erp-icon-btn"
                          title="Editar Guía"
                          aria-label="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={(e) => handleDelete(awb.id, e)}
                          className="erp-icon-btn text-rose-500 hover:text-rose-600"
                          title="Eliminar Guía"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE VISTA PREVIA HTML / PDF */}
      {previewAwb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="erp-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Plane className="w-4 h-4 text-[#ff6600]" />
                  Vista Previa — {previewHawb ? `Guía Hija ${previewHawb.hawb_number}` : previewAwb.full_awb_number}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Selector Guía Master vs Guía Hija si tiene hijas */}
                {previewAwb.hawbs && previewAwb.hawbs.length > 0 && (
                  <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                    <button
                      onClick={() => setPreviewHawb(null)}
                      className={`text-xs px-2.5 py-1 rounded font-semibold transition-all ${
                        !previewHawb ? 'erp-btn-primary' : 'text-muted'
                      }`}
                    >
                      {STRINGS.awb.masterAwb}
                    </button>
                    {previewAwb.hawbs.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setPreviewHawb(h)}
                        className={`text-xs px-2.5 py-1 rounded font-semibold transition-all ${
                          previewHawb?.id === h.id ? 'erp-btn-primary' : 'text-muted'
                        }`}
                      >
                        {STRINGS.awb.houseAwb} {h.hawb_number}
                      </button>
                    ))}
                  </div>
                )}

                {/* SELECTOR DE COPIA */}
                <div className="flex items-center gap-1.5 bg-surface-raised px-2.5 py-1 rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                  <label className="text-[11px] font-bold text-muted whitespace-nowrap">{STRINGS.awb.copyLabel}</label>
                  <select
                    value={selectedCopy}
                    onChange={(e) => setSelectedCopy(e.target.value)}
                    className="erp-input text-xs py-0.5 px-2 font-semibold bg-transparent border-0 cursor-pointer focus:ring-0 max-w-[210px]"
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
                </div>

                <button
                  onClick={() => handlePrintPdf(previewAwb, previewHawb || undefined, selectedCopy)}
                  className="erp-btn-primary text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{STRINGS.awb.printPdf}</span>
                </button>

                <button
                  onClick={() => exportAwbToExcel(previewAwb, selectedCopy)}
                  disabled={isExporting}
                  className="erp-btn-secondary text-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isExporting ? STRINGS.common.saving : STRINGS.common.exportExcel}</span>
                </button>

                <button
                  onClick={() => setPreviewAwb(null)}
                  className="erp-icon-btn ml-1"
                  aria-label="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body iframe */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-900 flex justify-center">
              <iframe
                title="AWB Preview"
                srcDoc={buildAwbHtml(previewAwb, previewHawb || undefined, selectedCopy)}
                className="w-full max-w-[840px] h-[780px] bg-white shadow-xl border rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
