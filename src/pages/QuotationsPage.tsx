import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Printer,
  Eye,
} from 'lucide-react';
import type { Quotation } from '../types/practiko';
import { PractikoQuotationService } from '../services/practikoService';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { buildQuotationHtml } from '../templates/quotationPdfTemplate';

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { printHtml, previewHtml } = usePdfGenerator();

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const data = await PractikoQuotationService.getQuotations();
      setQuotations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const handlePrint = (q: Quotation) => {
    const html = buildQuotationHtml(q);
    printHtml(html, { title: `Cotización ${q.consecutivo} — INGELOX` });
  };

  const handlePreview = (q: Quotation) => {
    const html = buildQuotationHtml(q);
    previewHtml(html, `Cotización ${q.consecutivo} — INGELOX`);
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
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Centro de Cotizaciones</h1>
            <span className="text-[10px] bg-orange-500/10 text-brand-orange border border-orange-500/20 px-2 py-0.5 rounded font-mono font-bold">
              ESTÁNDAR PRACTIKO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Emisión de propuestas comerciales de carga con consecutivo CS-YYMM, desglose de IVA y plantilla oficial en PDF.
          </p>
        </div>

        <button
          onClick={() => navigate('/quotations/new')}
          className="erp-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cotización</span>
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por consecutivo (ej. CS-2609-7), cliente o NIT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="erp-input pl-9"
          />
        </div>
      </div>

      {/* TABLA DE COTIZACIONES */}
      <div className="erp-card p-0 overflow-hidden">
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
                <th className="erp-th text-right">Total Oferta</th>
                <th className="erp-th">Estado</th>
                <th className="erp-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Cargando cotizaciones...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500 text-xs">
                    No hay cotizaciones registradas. Crea una nueva para comenzar.
                  </td>
                </tr>
              ) : (
                filtered.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="erp-td font-mono font-bold text-brand-orange">
                      {quote.consecutivo}
                    </td>
                    <td className="erp-td">
                      <div className="text-[11px] text-slate-200">{quote.fecha}</div>
                      <div className="text-[10px] text-slate-400">Val: {quote.validez}</div>
                    </td>
                    <td className="erp-td">
                      <div className="font-semibold text-slate-100">{quote.cliente_nombre}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NIT: {quote.cliente_nit}</div>
                    </td>
                    <td className="erp-td text-[11px] text-slate-300">
                      {quote.vendedor}
                    </td>
                    <td className="erp-td text-right font-mono text-slate-300">
                      {quote.moneda} {quote.subtotal.toLocaleString('es-CO')}
                    </td>
                    <td className="erp-td text-right font-mono text-slate-400">
                      {quote.moneda} {quote.total_iva.toLocaleString('es-CO')}
                    </td>
                    <td className="erp-td text-right font-mono font-bold text-white">
                      {quote.moneda} {quote.total.toLocaleString('es-CO')}
                    </td>
                    <td className="erp-td">
                      <span className="erp-badge-emerald uppercase">
                        {quote.estado}
                      </span>
                    </td>
                    <td className="erp-td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePreview(quote)}
                          title="Vista Previa de la plantilla"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrint(quote)}
                          title="Imprimir / Exportar a PDF"
                          className="p-1.5 rounded-lg bg-brand-orange/20 hover:bg-brand-orange text-brand-orange hover:text-white transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
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
    </div>
  );
};
