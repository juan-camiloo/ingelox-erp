import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Printer,
  Eye,
  Edit2,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import type { ShippingInstruction } from '../types/commercial';
import { ShippingInstructionService } from '../services/commercialService';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { useExcelGenerator } from '../hooks/useExcelGenerator';
import { buildInstructionHtml } from '../templates/instructionPdfTemplate';
import { MarqueeText } from '../components/common/MarqueeText';

export const InstructionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [instructions, setInstructions] = useState<ShippingInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const navigate = useNavigate();

  const { printHtml, previewHtml } = usePdfGenerator();
  const { exportInstructionToExcel, isExporting } = useExcelGenerator();

  const loadInstructions = async () => {
    setLoading(true);
    try {
      const data = await ShippingInstructionService.getInstructions();
      setInstructions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstructions();
  }, []);

  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  const handlePrintPdf = (inst: ShippingInstruction) => {
    const html = buildInstructionHtml(inst, inst.concepts);
    printHtml(html, {
      title: `Instrucción de Embarque ${inst.do_number} — INGELOX`,
      orientation: 'landscape',
    });
  };

  const handlePreviewPdf = (inst: ShippingInstruction) => {
    const html = buildInstructionHtml(inst, inst.concepts);
    previewHtml(html, `Instrucción de Embarque ${inst.do_number} — INGELOX`);
  };

  const handleExportExcel = async (inst: ShippingInstruction) => {
    await exportInstructionToExcel(inst, inst.concepts);
  };

  const handleChangeStatus = async (inst: ShippingInstruction, nextStatus: 'borrador' | 'finalizada') => {
    await ShippingInstructionService.updateInstructionStatus(inst.id, nextStatus);
    await loadInstructions();
  };

  const handleDelete = async (inst: ShippingInstruction) => {
    if (!confirm(`¿Eliminar la instrucción de embarque ${inst.do_number} de ${inst.cliente}?`)) return;
    await ShippingInstructionService.deleteInstruction(inst.id);
    await loadInstructions();
  };

  const filtered = instructions.filter((i) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      i.do_number.toLowerCase().includes(term) ||
      i.cliente.toLowerCase().includes(term) ||
      i.comercial.toLowerCase().includes(term) ||
      i.ruta.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="erp-page-title">Instrucciones de Embarque</h1>
          <p className="erp-page-subtitle">
            Gestión de instrucciones operativas de despacho y transporte.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => navigate('/instructions/new')}
            className="erp-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Instrucción</span>
          </button>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="erp-filter-bar">
        <div className="relative w-full max-w-md">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-disabled)' }}
          />
          <input
            type="text"
            placeholder="Buscar por número DO, cliente o asesor comercial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="erp-search-input"
          />
        </div>
      </div>

      {/* TABLA DE INSTRUCCIONES */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th className="erp-th">Detalle DO</th>
              <th className="erp-th">Fecha Creación</th>
              <th className="erp-th">Cliente / Empresa</th>
              <th className="erp-th">Comercial / Cotización</th>
              <th className="erp-th">Vía & Modalidad</th>
              <th className="erp-th">Ruta</th>
              <th className="erp-th">Estado</th>
              <th className="erp-th text-right">Acciones & Documentos</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  Cargando instrucciones de embarque...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No hay instrucciones registradas. Crea una nueva instrucción o importa desde el sistema.
                </td>
              </tr>
            ) : (
              filtered.map((inst) => (
                <tr key={inst.id} className="erp-tr">
                  <td className="erp-td font-mono font-bold whitespace-nowrap" style={{ color: 'var(--brand-orange)' }}>
                    {inst.do_number}
                  </td>
                  <td className="erp-td font-mono text-[11px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {inst.fecha_creacion}
                  </td>
                  <td className="erp-td font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <MarqueeText
                      text={inst.cliente}
                      containerClassName="max-w-[180px] sm:max-w-[240px]"
                      className="font-semibold"
                    />
                  </td>
                  <td className="erp-td whitespace-nowrap">
                    <div className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{inst.comercial}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Cotización: {inst.oferta || '--'}</div>
                  </td>
                  <td className="erp-td whitespace-nowrap">
                    <div className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{inst.via}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{inst.modalidad}</div>
                  </td>
                  <td className="erp-td font-mono text-[11px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    <MarqueeText
                      text={inst.ruta || '--'}
                      containerClassName="max-w-[140px] sm:max-w-[180px]"
                      className="font-mono text-[11px]"
                    />
                  </td>
                  <td className="erp-td whitespace-nowrap">
                    <select
                      value={inst.estado}
                      onChange={(e) => handleChangeStatus(inst, e.target.value as 'borrador' | 'finalizada')}
                      className="erp-select text-[11px] py-1 px-2.5 w-auto font-medium cursor-pointer shrink-0"
                      style={{
                        borderColor: inst.estado === 'finalizada' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(249, 115, 22, 0.4)',
                        color: inst.estado === 'finalizada' ? '#10b981' : '#f97316'
                      }}
                    >
                      <option value="borrador">Borrador</option>
                      <option value="finalizada">Finalizada</option>
                    </select>
                  </td>
                  <td className="erp-td text-right whitespace-nowrap">
                    <div className="erp-action-group">
                      <button
                        onClick={() => handlePreviewPdf(inst)}
                        title="Vista previa del documento PDF"
                        className="erp-action-btn erp-action-btn-view"
                        aria-label="Vista previa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/instructions/new?id=${inst.id}`)}
                        title="Editar instrucción"
                        className="erp-action-btn erp-action-btn-edit"
                        aria-label="Editar instrucción"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePrintPdf(inst)}
                        title=" Exportar a PDF"
                        className="erp-action-btn erp-action-btn-print"
                        aria-label="Imprimir PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleExportExcel(inst)}
                        disabled={isExporting}
                        title="Exportar Excel"
                        className="erp-action-btn erp-action-btn-excel"
                        aria-label="Exportar Excel"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/shipments/new?instructionId=${inst.id}`)}
                        title="Abrir / Crear Embarque en Tráfico con estos datos"
                        className="erp-action-btn erp-action-btn-flow"
                        aria-label="Abrir en Tráfico"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(inst)}
                        title="Eliminar instrucción"
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
