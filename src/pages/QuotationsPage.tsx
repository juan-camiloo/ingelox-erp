import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Printer,
  Eye,
  Edit2,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import type { Quotation } from '../types/commercial';
import { QuotationService } from '../services/commercialService';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { buildQuotationHtml } from '../templates/quotationPdfTemplate';
import { MarqueeText } from '../components/common/MarqueeText';

export const QuotationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const navigate = useNavigate();
  const { printHtml, previewHtml } = usePdfGenerator();

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const data = await QuotationService.getQuotations();
      setQuotations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  const handlePrint = (q: Quotation) => {
    const html = buildQuotationHtml(q);
    printHtml(html, { title: `Cotización ${q.consecutivo} — INGELOX` });
  };

  const handlePreview = (q: Quotation) => {
    const html = buildQuotationHtml(q);
    previewHtml(html, `Cotización ${q.consecutivo} — INGELOX`);
  };

  const handleChangeStatus = async (q: Quotation, nextStatus: Quotation['estado']) => {
    await QuotationService.updateQuotationStatus(q.id, nextStatus);
    await loadQuotations();
  };

  const handleDelete = async (q: Quotation) => {
    if (!confirm(`¿Eliminar la cotización ${q.consecutivo} de ${q.cliente_nombre}?`)) return;
    await QuotationService.deleteQuotation(q.id);
    await loadQuotations();
  };

  const filtered = quotations.filter((q) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      q.consecutivo.toLowerCase().includes(term) ||
      q.cliente_nombre.toLowerCase().includes(term) ||
      q.cliente_nit.toLowerCase().includes(term) ||
      q.vendedor.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="erp-page-title">Centro de Cotizaciones</h1>
          <p className="erp-page-subtitle">
            Propuestas comerciales de carga y emisión oficial en PDF.
          </p>
        </div>

        <button
          onClick={() => navigate('/quotations/new')}
          className="erp-btn-primary shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cotización</span>
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="erp-filter-bar">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-disabled)' }} />
          <input
            type="text"
            placeholder="Buscar por consecutivo (ej. CS-2609-7), cliente o NIT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="erp-search-input"
          />
        </div>
      </div>

      {/* TABLA DE COTIZACIONES */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th className="erp-th">Consecutivo</th>
              <th className="erp-th">Fecha / Validez</th>
              <th className="erp-th">Cliente / Razón Social</th>
              <th className="erp-th">Vendedor</th>
              <th className="erp-th text-right">Subtotal</th>
              <th className="erp-th text-right">IVA</th>
              <th className="erp-th text-right">Total Cotización</th>
              <th className="erp-th">Estado</th>
              <th className="erp-th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  Cargando cotizaciones...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No hay cotizaciones registradas. Crea una nueva para comenzar.
                </td>
              </tr>
            ) : (
              filtered.map((quote) => (
                <tr key={quote.id} className="erp-tr">
                  <td className="erp-td font-mono font-bold whitespace-nowrap" style={{ color: 'var(--brand-orange)' }}>
                    {quote.consecutivo}
                  </td>
                  <td className="erp-td whitespace-nowrap">
                    <div className="text-[11px]" style={{ color: 'var(--text-primary)' }}>{quote.fecha}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Val: {quote.validez}</div>
                  </td>
                  <td className="erp-td">
                    <MarqueeText
                      text={quote.cliente_nombre}
                      containerClassName="max-w-[180px] sm:max-w-[240px]"
                      className="font-semibold"
                    />
                    <div className="text-[10px] font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>NIT: {quote.cliente_nit}</div>
                  </td>
                  <td className="erp-td text-[11px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {quote.vendedor}
                  </td>
                  <td className="erp-td text-right font-mono whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {quote.moneda} {quote.subtotal.toLocaleString('es-CO')}
                  </td>
                  <td className="erp-td text-right font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {quote.moneda} {quote.total_iva.toLocaleString('es-CO')}
                  </td>
                  <td className="erp-td text-right font-mono font-bold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {quote.moneda} {quote.total.toLocaleString('es-CO')}
                  </td>
                  <td className="erp-td whitespace-nowrap">
                    <select
                      value={quote.estado}
                      onChange={(e) => handleChangeStatus(quote, e.target.value as any)}
                      className={`text-[10px] font-bold uppercase rounded-lg px-2 py-1 cursor-pointer transition-colors border-0 shrink-0 whitespace-nowrap ${
                        quote.estado === 'aprobada'
                          ? 'erp-badge-emerald'
                          : quote.estado === 'rechazada'
                          ? 'erp-badge-danger'
                          : quote.estado === 'borrador'
                          ? 'erp-badge-slate'
                          : 'erp-badge-orange'
                      }`}
                      style={{ background: 'var(--surface-raised)' }}
                    >
                      <option value="borrador">Borrador</option>
                      <option value="enviada">Enviada</option>
                      <option value="aprobada">Aprobada</option>
                      <option value="rechazada">Rechazada</option>
                    </select>
                  </td>
                  <td className="erp-td text-right whitespace-nowrap">
                    <div className="erp-action-group">
                      <button
                        onClick={() => handlePreview(quote)}
                        title="Vista previa de la cotización"
                        className="erp-action-btn erp-action-btn-view"
                        aria-label="Vista previa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/quotations/new?id=${quote.id}`)}
                        title="Editar cotización"
                        className="erp-action-btn erp-action-btn-edit"
                        aria-label="Editar cotización"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePrint(quote)}
                        title=" Exportar a PDF"
                        className="erp-action-btn erp-action-btn-print"
                        aria-label="Imprimir PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/instructions/new?quotationId=${quote.id}`)}
                        title="Generar Instrucción de Embarque desde esta cotización"
                        className="erp-action-btn erp-action-btn-excel"
                        aria-label="Generar Instrucción"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(quote)}
                        title="Eliminar cotización"
                        className="erp-action-btn erp-action-btn-delete"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
