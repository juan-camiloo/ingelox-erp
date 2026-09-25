import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  X,
  Save,
} from 'lucide-react';
import type { BillingConcept } from '../types/practiko';
import { PractikoBillingConceptService } from '../services/practikoService';

export const BillingConceptsPage: React.FC = () => {
  const [concepts, setConcepts] = useState<BillingConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingConcept, setEditingConcept] = useState<BillingConcept | null>(null);

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [aplicaIva, setAplicaIva] = useState(false);
  const [porcentajeIva, setPorcentajeIva] = useState(19);
  const [moneda, setMoneda] = useState<'USD' | 'COP' | 'EUR'>('USD');
  const [valorSugerido, setValorSugerido] = useState<number>(0);
  const [categoria, setCategoria] = useState('Flete');
  const [saving, setSaving] = useState(false);

  const loadConcepts = async () => {
    setLoading(true);
    try {
      const data = await PractikoBillingConceptService.getConcepts();
      setConcepts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConcepts();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingConcept(null);
    setCodigo('IN - ');
    setNombre('');
    setAplicaIva(false);
    setPorcentajeIva(0);
    setMoneda('USD');
    setValorSugerido(0);
    setCategoria('Flete');
    setShowModal(true);
  };

  const handleOpenEditModal = (concept: BillingConcept) => {
    setEditingConcept(concept);
    setCodigo(concept.codigo);
    setNombre(concept.nombre);
    setAplicaIva(concept.aplica_iva);
    setPorcentajeIva(concept.porcentaje_iva);
    setMoneda(concept.moneda_default);
    setValorSugerido(concept.valor_sugerido || 0);
    setCategoria(concept.categoria || 'Flete');
    setShowModal(true);
  };

  const handleSaveConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) return;

    setSaving(true);
    try {
      await PractikoBillingConceptService.saveConcept({
        id: editingConcept?.id,
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        aplica_iva: aplicaIva,
        porcentaje_iva: aplicaIva ? Number(porcentajeIva) || 19 : 0,
        moneda_default: moneda,
        valor_sugerido: Number(valorSugerido) || 0,
        categoria: categoria.trim(),
      });

      setShowModal(false);
      await loadConcepts();
    } catch (err: any) {
      alert(err.message || 'Error al guardar concepto');
    } finally {
      setSaving(false);
    }
  };

  const filtered = concepts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Conceptos de Facturación</h1>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold">
              CATÁLOGO PRACTIKO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Estandarización de tarifas, servicios de transporte, manejos y recargos para cotizaciones y facturas.
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="erp-btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Nuevo Concepto</span>
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (ej. IN - FLETE) o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="erp-input pl-9"
          />
        </div>
      </div>

      {/* TABLA DE CONCEPTOS */}
      <div className="erp-card p-0 overflow-hidden">
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="erp-th">Código de Servicio</th>
                <th className="erp-th">Descripción del Concepto</th>
                <th className="erp-th">Categoría</th>
                <th className="erp-th">IVA Aplicable</th>
                <th className="erp-th">Moneda Default</th>
                <th className="erp-th text-right">Tarifa Sugerida</th>
                <th className="erp-th text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Cargando catálogo de conceptos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                    No hay conceptos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="erp-td font-mono font-bold text-white">
                      {item.codigo}
                    </td>
                    <td className="erp-td font-semibold text-slate-200">
                      {item.nombre}
                    </td>
                    <td className="erp-td">
                      <span className="erp-badge-slate">{item.categoria || 'General'}</span>
                    </td>
                    <td className="erp-td">
                      {item.aplica_iva ? (
                        <span className="erp-badge-orange">IVA {item.porcentaje_iva}%</span>
                      ) : (
                        <span className="erp-badge-emerald">Exento / 0%</span>
                      )}
                    </td>
                    <td className="erp-td font-mono font-bold text-slate-300">
                      {item.moneda_default}
                    </td>
                    <td className="erp-td text-right font-mono font-bold text-white">
                      {item.valor_sugerido
                        ? `${item.moneda_default} ${item.valor_sugerido.toLocaleString('es-CO')}`
                        : '--'}
                    </td>
                    <td className="erp-td text-right">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="text-xs text-brand-orange hover:text-orange-400 font-bold hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Receipt className="w-5 h-5 text-brand-orange" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                {editingConcept ? 'Editar Concepto de Facturación' : 'Nuevo Concepto — Practiko'}
              </h2>
            </div>

            <form onSubmit={handleSaveConcept} className="space-y-4">
              <div>
                <label className="erp-label">Código Oficial (Prefijo IN - )</label>
                <input
                  type="text"
                  placeholder="Ej: IN - FLETE AÉREO INTERNACIONAL"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  required
                  className="erp-input font-mono uppercase"
                />
              </div>

              <div>
                <label className="erp-label">Nombre Comercial del Servicio</label>
                <input
                  type="text"
                  placeholder="Ej: Flete Aéreo Internacional de Exportación"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="erp-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Categoría Operativa</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="erp-select"
                  >
                    <option value="Flete">Flete</option>
                    <option value="Terrestre">Terrestre</option>
                    <option value="Portuario/Aeroportuario">Portuario/Aeroportuario</option>
                    <option value="Documental">Documental</option>
                    <option value="Aduana">Aduana</option>
                    <option value="Seguridad">Seguridad</option>
                    <option value="Recargo">Recargo</option>
                    <option value="Agenciamiento">Agenciamiento</option>
                  </select>
                </div>

                <div>
                  <label className="erp-label">Moneda Predeterminada</label>
                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value as any)}
                    className="erp-select font-mono"
                  >
                    <option value="USD">USD — Dólares</option>
                    <option value="COP">COP — Pesos Colombianos</option>
                    <option value="EUR">EUR — Euros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="erp-label">Tarifa Base Sugerida</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={valorSugerido}
                    onChange={(e) => setValorSugerido(parseFloat(e.target.value) || 0)}
                    className="erp-input font-mono"
                  />
                </div>

                <div>
                  <label className="erp-label">Porcentaje IVA (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={porcentajeIva}
                    onChange={(e) => setPorcentajeIva(parseInt(e.target.value, 10) || 0)}
                    disabled={!aplicaIva}
                    className="erp-input font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={aplicaIva}
                    onChange={(e) => {
                      setAplicaIva(e.target.checked);
                      if (e.target.checked && porcentajeIva === 0) setPorcentajeIva(19);
                    }}
                    className="rounded text-brand-orange focus:ring-brand-orange"
                  />
                  <span className="font-semibold">Aplica Impuesto al Valor Agregado (IVA)</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-1 pl-5">
                  Los fletes internacionales suelen estar exentos (0%), mientras que gastos de manejo local y aduanero causan IVA del 19%.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="erp-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="erp-btn-primary"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Guardando...' : 'Guardar Concepto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
