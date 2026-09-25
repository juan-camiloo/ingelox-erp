import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Printer,
  Eye,
} from 'lucide-react';
import type { ShippingInstruction } from '../types/practiko';
import { ShippingInstructionService } from '../services/practikoService';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { useExcelGenerator } from '../hooks/useExcelGenerator';
import { buildInstructionHtml } from '../templates/instructionPdfTemplate';

export const InstructionsPage: React.FC = () => {
  const [instructions, setInstructions] = useState<ShippingInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Instrucciones de Embarque</h1>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
              MODALIDAD 17 & EXCELJS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Generación y gestión de instrucciones operativas con exportación idéntica a la plantilla Excel y PDF oficial.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número DO, cliente o asesor comercial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="erp-input pl-9"
          />
        </div>
      </div>

      {/* TABLA DE INSTRUCCIONES */}
      <div className="erp-card p-0 overflow-hidden">
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="erp-th">Expediente DO</th>
                <th className="erp-th">Fecha Creación</th>
                <th className="erp-th">Cliente / Empresa</th>
                <th className="erp-th">Comercial / Oferta</th>
                <th className="erp-th">Vía & Modalidad</th>
                <th className="erp-th">Ruta</th>
                <th className="erp-th">Estado</th>
                <th className="erp-th text-right">Descargas & PDF</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Cargando instrucciones de embarque...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    No hay instrucciones registradas. Crea una nueva instrucción o importa desde SQLite.
                  </td>
                </tr>
              ) : (
                filtered.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="erp-td font-mono font-bold text-brand-orange">
                      {inst.do_number}
                    </td>
                    <td className="erp-td font-mono text-[11px] text-slate-300">
                      {inst.fecha_creacion}
                    </td>
                    <td className="erp-td font-semibold text-slate-100">
                      {inst.cliente}
                    </td>
                    <td className="erp-td">
                      <div className="text-[11px] text-slate-200">{inst.comercial}</div>
                      <div className="text-[10px] text-slate-400">Oferta: {inst.oferta || '--'}</div>
                    </td>
                    <td className="erp-td">
                      <div className="text-[11px] font-bold text-slate-200">{inst.via}</div>
                      <div className="text-[10px] text-slate-400">{inst.modalidad}</div>
                    </td>
                    <td className="erp-td font-mono text-[11px] text-slate-300">
                      {inst.ruta || '--'}
                    </td>
                    <td className="erp-td">
                      <span className={inst.estado === 'finalizada' ? 'erp-badge-emerald' : 'erp-badge-orange'}>
                        {inst.estado}
                      </span>
                    </td>
                    <td className="erp-td text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePreviewPdf(inst)}
                          title="Vista previa del documento PDF"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrintPdf(inst)}
                          title="Imprimir / Exportar a PDF"
                          className="p-1.5 rounded-lg bg-brand-orange/20 hover:bg-brand-orange text-brand-orange hover:text-white transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportExcel(inst)}
                          disabled={isExporting}
                          title="Exportar a Excel oficial (.xlsx)"
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
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
