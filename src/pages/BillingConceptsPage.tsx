import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  X,
  Save,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { BillingConcept } from '../types/commercial';
import { BillingConceptService } from '../services/commercialService';
import { MarqueeText } from '../components/common/MarqueeText';

export const BillingConceptsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [concepts, setConcepts] = useState<BillingConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

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
      const data = await BillingConceptService.getConcepts();
      setConcepts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConcepts();
  }, []);

  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  const handleDeleteConcept = async (concept: BillingConcept) => {
    if (!confirm(`¿Eliminar el concepto "${concept.nombre}" (${concept.codigo})?\nEsta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await BillingConceptService.deleteConcept(concept.id);
      await loadConcepts();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message || 'No se pudo eliminar el concepto'}`);
    }
  };

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
      await BillingConceptService.saveConcept({
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
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="erp-page-title">Conceptos de Facturación</h1>
          <p className="erp-page-subtitle">
            Catálogo de tarifas, servicios de transporte y recargos operativos.
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="erp-btn-primary shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Nuevo Concepto</span>
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="erp-filter-bar">
        <div className="relative w-full max-w-md">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-disabled)' }}
          />
          <input
            type="text"
            placeholder="Buscar por código (ej. IN - FLETE) o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="erp-search-input"
          />
        </div>
      </div>

      {/* TABLA DE CONCEPTOS */}
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
                <td colSpan={7} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  Cargando catálogo de conceptos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No hay conceptos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="erp-tr">
                  <td className="erp-td font-mono font-bold whitespace-nowrap" style={{ color: 'var(--brand-orange)' }}>
                    <MarqueeText
                      text={item.codigo}
                      containerClassName="max-w-[180px] sm:max-w-[220px]"
                      className="font-mono font-bold"
                    />
                  </td>
                  <td className="erp-td font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <MarqueeText
                      text={item.nombre}
                      containerClassName="max-w-[220px] sm:max-w-[320px]"
                      className="font-semibold"
                    />
                  </td>
                  <td className="erp-td whitespace-nowrap">
                    <span className="erp-badge-slate">{item.categoria || 'General'}</span>
                  </td>
                  <td className="erp-td whitespace-nowrap">
                    {item.aplica_iva ? (
                      <span className="erp-badge-orange">IVA {item.porcentaje_iva}%</span>
                    ) : (
                      <span className="erp-badge-emerald">Exento (0%)</span>
                    )}
                  </td>
                  <td className="erp-td font-mono font-bold whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {item.moneda_default}
                  </td>
                  <td className="erp-td text-right font-mono font-bold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {item.valor_sugerido
                      ? `${item.moneda_default} ${item.valor_sugerido.toLocaleString('es-CO')}`
                      : '--'}
                  </td>
                  <td className="erp-td text-right whitespace-nowrap">
                    <div className="erp-action-group">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="erp-action-btn erp-action-btn-edit"
                        title="Editar concepto"
                        aria-label="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteConcept(item)}
                        className="erp-action-btn erp-action-btn-delete"
                        title="Eliminar concepto del catálogo"
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

      {/* MODAL CREAR / EDITAR */}
      {showModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="erp-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="erp-modal w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            {/* Header Pinned */}
            <div className="erp-modal-header">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 shrink-0" style={{ color: 'var(--brand-orange)' }} />
                <h2 className="erp-page-title text-base uppercase tracking-wider">
                  {editingConcept ? 'Editar Concepto de Facturación' : 'Nuevo Concepto'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="erp-icon-btn"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConcept} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="erp-modal-body space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="erp-card-subtle">
                <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={aplicaIva}
                    onChange={(e) => {
                      setAplicaIva(e.target.checked);
                      if (e.target.checked && porcentajeIva === 0) setPorcentajeIva(19);
                    }}
                    className="rounded accent-[#F35815]"
                  />
                  <span className="font-semibold">Aplica Impuesto al Valor Agregado (IVA)</span>
                </label>
                <p className="text-[10px] mt-1 pl-5" style={{ color: 'var(--text-muted)' }}>
                  Los fletes internacionales suelen estar exentos (0%), mientras que gastos de manejo local y aduanero causan IVA del 19%.
                </p>
              </div>
            </div>

            {/* Pinned Footer */}
            <div className="erp-modal-footer">
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
        </div>,
        document.body
      )}
    </div>
  );
};
