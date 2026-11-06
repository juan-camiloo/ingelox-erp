import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Save,
  Printer,
  Eye,
  Plus,
  Trash2,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';
import type { Quotation, QuotationItem, ThirdParty, BillingConcept } from '../types/commercial';
import {
  QuotationService,
  ThirdPartyService,
  BillingConceptService,
} from '../services/commercialService';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { buildQuotationHtml } from '../templates/quotationPdfTemplate';
import { saveFormDraft, loadFormDraft, clearFormDraft } from '../lib/draftStorage';

export const QuotationCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const { printHtml, previewHtml } = usePdfGenerator();

  const [quotationId, setQuotationId] = useState(() => editId || `quote-${Date.now()}`);
  const [isEditing, setIsEditing] = useState(Boolean(editId));
  const [draftRestored, setDraftRestored] = useState(false);
  const [consecutivo, setConsecutivo] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [validez, setValidez] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [formaPago, setFormaPago] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [atencion, setAtencion] = useState('');
  const [estado, setEstado] = useState<Quotation['estado']>('borrador');

  // Cliente / Tercero
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  const [selectedThirdPartyId, setSelectedThirdPartyId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteNit, setClienteNit] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');

  // Catálogo de conceptos
  const [billingConcepts, setBillingConcepts] = useState<BillingConcept[]>([]);

  // Ítems cotizados
  const [items, setItems] = useState<QuotationItem[]>([]);

  const [moneda, setMoneda] = useState<'USD' | 'COP' | 'EUR'>('USD');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);

  const applyThirdParty = useCallback((p: ThirdParty) => {
    setSelectedThirdPartyId(p.id);
    setClienteNombre(p.razon_social);
    setClienteNit(p.identificacion ? `${p.identificacion}${p.dv ? '-' + p.dv : ''}` : '');
    setClienteDireccion(p.direccion || '');
    setClienteTelefono(p.telefono || '');
    if (p.vendedor) setVendedor(p.vendedor);
    if (p.dias_credito > 0) {
      setFormaPago(`A ${p.dias_credito} DIAS`);
    } else {
      setFormaPago('CONTADO');
    }
  }, []);

  useEffect(() => {
    async function init() {
      const parties = await ThirdPartyService.getThirdParties();
      setThirdParties(parties);

      const concepts = await BillingConceptService.getConcepts();
      setBillingConcepts(concepts);

      if (editId) {
        const existing = await QuotationService.getQuotationById(editId);
        if (existing) {
          setIsEditing(true);
          setQuotationId(existing.id);
          setConsecutivo(existing.consecutivo);
          setFecha(existing.fecha);
          setValidez(existing.validez);
          setFormaPago(existing.forma_pago);
          setVendedor(existing.vendedor);
          setAtencion(existing.atencion);
          setSelectedThirdPartyId(existing.tercero_id || '');
          setClienteNombre(existing.cliente_nombre);
          setClienteNit(existing.cliente_nit);
          setClienteDireccion(existing.cliente_direccion);
          setClienteTelefono(existing.cliente_telefono);
          setItems(existing.items || []);
          setMoneda(existing.moneda);
          setObservaciones(existing.observaciones);
          setEstado(existing.estado);
          return;
        }
      }

      const nextConsecutive = await QuotationService.generateNextConsecutive();
      setConsecutivo(nextConsecutive);

      if (!editId) {
        const draft = loadFormDraft<any>('quotation_create');
        if (draft) {
          if (draft.clienteNombre) setClienteNombre(draft.clienteNombre);
          if (draft.clienteNit) setClienteNit(draft.clienteNit);
          if (draft.clienteDireccion) setClienteDireccion(draft.clienteDireccion);
          if (draft.clienteTelefono) setClienteTelefono(draft.clienteTelefono);
          if (draft.selectedThirdPartyId) setSelectedThirdPartyId(draft.selectedThirdPartyId);
          if (draft.vendedor) setVendedor(draft.vendedor);
          if (draft.atencion) setAtencion(draft.atencion);
          if (draft.formaPago) setFormaPago(draft.formaPago);
          if (draft.items && draft.items.length > 0) setItems(draft.items);
          if (draft.moneda) setMoneda(draft.moneda);
          if (draft.observaciones) setObservaciones(draft.observaciones);
          if (draft.estado) setEstado(draft.estado);
          setDraftRestored(true);
        } else if (parties.length > 0) {
          applyThirdParty(parties[0]);
        }
      }
    }
    init();
  }, [editId, applyThirdParty]);

  // Auto-guardado de borrador en sessionStorage
  useEffect(() => {
    if (editId) return;
    if (!clienteNombre && !observaciones) return;
    saveFormDraft('quotation_create', {
      clienteNombre,
      clienteNit,
      clienteDireccion,
      clienteTelefono,
      selectedThirdPartyId,
      vendedor,
      atencion,
      formaPago,
      items,
      moneda,
      observaciones,
      estado,
    });
  }, [editId, clienteNombre, clienteNit, clienteDireccion, clienteTelefono, selectedThirdPartyId, vendedor, atencion, formaPago, items, moneda, observaciones, estado]);

  const handleSelectThirdParty = (p: ThirdParty) => {
    applyThirdParty(p);
  };

  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: String(Date.now()),
      orden: items.length + 1,
      cantidad: 1,
      concepto: billingConcepts[0]?.codigo || 'IN - SERVICIO LOGISTICO',
      valor_unitario: billingConcepts[0]?.valor_sugerido || 0,
      porcentaje_descuento: 0,
      subtotal: billingConcepts[0]?.valor_sugerido || 0,
      iva: billingConcepts[0]?.aplica_iva ? (billingConcepts[0]?.valor_sugerido || 0) * 0.19 : 0,
      total: billingConcepts[0]?.valor_sugerido || 0,
    };
    newItem.total = newItem.subtotal + newItem.iva;
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    if (field === 'concepto') {
      const match = billingConcepts.find((c) => c.codigo === val || c.nombre === val);
      if (match) {
        item.valor_unitario = match.valor_sugerido || item.valor_unitario;
        const discountFactor = (100 - (Number(item.porcentaje_descuento) || 0)) / 100;
        item.subtotal = (Number(item.cantidad) || 0) * (Number(item.valor_unitario) || 0) * discountFactor;
        item.iva = match.aplica_iva ? item.subtotal * ((match.porcentaje_iva || 19) / 100) : 0;
        item.total = item.subtotal + item.iva;
        updated[index] = item;
        setItems(updated);
        return;
      }
    }

    const qty = Number(item.cantidad) || 0;
    const unitPrice = Number(item.valor_unitario) || 0;
    const discount = Number(item.porcentaje_descuento) || 0;
    const discountFactor = (100 - discount) / 100;

    item.subtotal = qty * unitPrice * discountFactor;

    const currentConcept = billingConcepts.find((c) => c.codigo === item.concepto);
    const appliesIva = currentConcept ? currentConcept.aplica_iva : item.iva > 0;
    const ivaRate = currentConcept?.porcentaje_iva ? currentConcept.porcentaje_iva / 100 : 0.19;

    if (field === 'iva') {
      item.iva = Number(val) || 0;
    } else if (appliesIva) {
      item.iva = Math.round(item.subtotal * ivaRate * 100) / 100;
    } else {
      item.iva = 0;
    }

    item.total = item.subtotal + item.iva;
    updated[index] = item;
    setItems(updated);
  };

  const subtotal = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const totalIva = items.reduce((acc, it) => acc + (it.iva || 0), 0);
  const total = subtotal + totalIva;

  const currentQuotationObject: Quotation = {
    id: quotationId,
    consecutivo,
    fecha,
    validez,
    forma_pago: formaPago,
    vendedor,
    atencion,
    tercero_id: selectedThirdPartyId || null,
    cliente_nombre: clienteNombre,
    cliente_nit: clienteNit,
    cliente_direccion: clienteDireccion,
    cliente_telefono: clienteTelefono,
    observaciones,
    condiciones: [],
    subtotal,
    total_iva: totalIva,
    total,
    moneda,
    estado,
    items,
  };

  const handleSave = async () => {
    if (!clienteNombre.trim() || items.length === 0) {
      alert('Debes indicar el cliente y al menos un concepto en la cotización.');
      return;
    }

    setSaving(true);
    try {
      await QuotationService.saveQuotation(currentQuotationObject);
      setIsEditing(true);
      clearFormDraft('quotation_create');
      navigate('/quotations');
    } catch (err: any) {
      alert(err.message || 'Error al guardar cotización');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInstruction = () => {
    navigate(`/instructions/new?quotationId=${encodeURIComponent(quotationId)}`);
  };

  const handlePreviewPdf = () => {
    const html = buildQuotationHtml(currentQuotationObject);
    previewHtml(html, `Cotización ${consecutivo}`);
  };

  const handlePrintPdf = () => {
    const html = buildQuotationHtml(currentQuotationObject);
    printHtml(html, { title: `Cotización ${consecutivo}` });
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotations')}
            className="erp-btn-secondary p-2"
            aria-label="Volver a cotizaciones"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="erp-page-title">
              {isEditing ? `Editar Cotización ${consecutivo}` : `Nueva Cotización ${consecutivo}`}
            </h1>
            <p className="erp-page-subtitle">
              Propuesta comercial de transporte con exportación formal en PDF.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleGenerateInstruction}
            className="erp-btn-secondary"
            title="Generar Instrucción de Embarque con estos datos"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Generar Instrucción</span>
          </button>
          <button onClick={handlePreviewPdf} className="erp-btn-secondary">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Vista Previa</span>
          </button>
          <button onClick={handlePrintPdf} className="erp-btn-secondary">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir PDF</span>
          </button>
          <button onClick={handleSave} disabled={saving} className="erp-btn-primary">
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Guardar Cotización'}</span>
          </button>
        </div>
      </div>

      {draftRestored && (
        <div className="erp-badge-emerald w-full p-3 rounded-xl flex items-center justify-between text-xs">
          <span>Borrador de cotización recuperado automáticamente. Tu trabajo no se perdió.</span>
          <button
            type="button"
            onClick={() => {
              clearFormDraft('quotation_create');
              setDraftRestored(false);
            }}
            className="underline cursor-pointer text-[10px] ml-3 text-emerald-700 dark:text-emerald-300"
          >
            Descartar borrador
          </button>
        </div>
      )}

      {/* FORMULARIO ENCABEZADO */}
      <div className="erp-card space-y-4">
        <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-orange-text)' }}>
            1. Datos de la Propuesta & Cliente
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Estado:</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              className="erp-select text-xs font-bold uppercase py-1 px-2"
            >
              <option value="borrador">Borrador</option>
              <option value="enviada">Enviada</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
        </div>

        {/* SELECTOR DE TERCERO */}
        <div className="erp-card-subtle space-y-2">
          <label className="erp-label">Seleccionar Cliente desde Directorio de Terceros</label>
          <select
            value={selectedThirdPartyId}
            onChange={(e) => {
              const found = thirdParties.find((p) => p.id === e.target.value);
              if (found) handleSelectThirdParty(found);
            }}
            className="erp-select font-semibold"
          >
            <option value="">-- Seleccionar o escribir manualmente abajo --</option>
            {thirdParties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.razon_social} (NIT: {p.identificacion}-{p.dv})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="erp-label">Consecutivo</label>
            <input
              type="text"
              value={consecutivo}
              onChange={(e) => setConsecutivo(e.target.value)}
              className="erp-input font-mono font-bold"
              style={{ color: 'var(--brand-orange)' }}
            />
          </div>
          <div>
            <label className="erp-label">Fecha de Emisión</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="erp-input"
            />
          </div>
          <div>
            <label className="erp-label">Validez de la Cotización</label>
            <input
              type="date"
              value={validez}
              onChange={(e) => setValidez(e.target.value)}
              className="erp-input"
            />
          </div>
          <div>
            <label className="erp-label">Forma de Pago</label>
            <input
              type="text"
              placeholder="Ej: A 30 DIAS"
              value={formaPago}
              onChange={(e) => setFormaPago(e.target.value)}
              className="erp-input uppercase font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="erp-label">Asesor Comercial (Vendedor)</label>
            <input
              type="text"
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              className="erp-input uppercase"
            />
          </div>
          <div>
            <label className="erp-label">Atención a (Contacto Cliente)</label>
            <input
              type="text"
              placeholder="Ej: EDWIN PULIDO"
              value={atencion}
              onChange={(e) => setAtencion(e.target.value)}
              className="erp-input uppercase"
            />
          </div>
          <div>
            <label className="erp-label">Moneda de Cotización</label>
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value as any)}
              className="erp-select font-mono font-bold"
            >
              <option value="USD">USD — Dólares Americanos</option>
              <option value="COP">COP — Pesos Colombianos</option>
              <option value="EUR">EUR — Euros</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
          <div className="sm:col-span-2">
            <label className="erp-label">Razón Social Cliente</label>
            <input
              type="text"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="erp-input uppercase font-semibold"
            />
          </div>
          <div>
            <label className="erp-label">NIT / Documento</label>
            <input
              type="text"
              value={clienteNit}
              onChange={(e) => setClienteNit(e.target.value)}
              className="erp-input font-mono"
            />
          </div>
          <div>
            <label className="erp-label">Teléfono</label>
            <input
              type="text"
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
              className="erp-input font-mono"
            />
          </div>
        </div>
      </div>

      {/* TABLA DE CONCEPTOS COTIZADOS */}
      <div className="erp-card space-y-4">
        <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-orange-text)' }}>
            2. Conceptos Tarifarios & Servicios Cotizados
          </h2>
          <button onClick={handleAddItem} className="erp-btn-primary py-1 px-3 text-[11px]">
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Concepto</span>
          </button>
        </div>

        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="erp-th text-center w-12">Cant</th>
                <th className="erp-th text-left">Concepto / Servicio</th>
                <th className="erp-th text-right w-28">Vr. Unitario</th>
                <th className="erp-th text-center w-20">% Dto</th>
                <th className="erp-th text-right w-28">Subtotal</th>
                <th className="erp-th text-right w-24">IVA</th>
                <th className="erp-th text-right w-28">Total</th>
                <th className="erp-th text-center w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="erp-tr">
                  <td className="erp-td text-center">
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value) || 1)}
                      className="erp-input p-1 text-center font-mono w-14"
                    />
                  </td>
                  <td className="erp-td">
                    <input
                      type="text"
                      list={`concepts-list-${index}`}
                      value={item.concepto}
                      onChange={(e) => handleItemChange(index, 'concepto', e.target.value)}
                      className="erp-input font-bold uppercase text-xs"
                      placeholder="Selecciona o escribe el concepto..."
                    />
                    <datalist id={`concepts-list-${index}`}>
                      {billingConcepts.map((bc) => (
                        <option key={bc.id} value={bc.codigo}>
                          {bc.nombre}
                        </option>
                      ))}
                    </datalist>
                  </td>
                  <td className="erp-td text-right">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.valor_unitario}
                      onChange={(e) => handleItemChange(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                      className="erp-input p-1 text-right font-mono text-xs"
                    />
                  </td>
                  <td className="erp-td text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.porcentaje_descuento}
                      onChange={(e) => handleItemChange(index, 'porcentaje_descuento', parseFloat(e.target.value) || 0)}
                      className="erp-input p-1 text-center font-mono w-16 text-xs"
                    />
                  </td>
                  <td className="erp-td text-right font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {item.subtotal.toLocaleString('es-CO')}
                  </td>
                  <td className="erp-td text-right">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.iva}
                      onChange={(e) => handleItemChange(index, 'iva', parseFloat(e.target.value) || 0)}
                      className="erp-input p-1 text-right font-mono text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </td>
                  <td className="erp-td text-right font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    {item.total.toLocaleString('es-CO')}
                  </td>
                  <td className="erp-td text-center">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="erp-icon-btn hover:text-rose-500"
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALIZADORES FINANCIEROS */}
        <div className="flex justify-end pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
          <div className="erp-card-subtle w-full sm:w-80 space-y-2 font-mono text-xs">
            <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
              <span>Subtotal ({moneda}):</span>
              <span>{subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
              <span>Total IVA ({moneda}):</span>
              <span>{totalIva.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-2" style={{ borderTop: '1px solid var(--border-default)', color: 'var(--brand-orange)' }}>
              <span>TOTAL COTIZACIÓN:</span>
              <span>{moneda} {total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* OBSERVACIONES DEL EMBARQUE */}
      <div className="erp-card space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-orange-text)' }}>
          3. Observaciones Operativas de la Cotización
        </h2>
        <textarea
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Ej: EXP AEREA BOG - GDL 1 CAJA 25 KG IMO 9 UN3082 DIM: 42x40x50 cm"
          className="erp-textarea font-mono uppercase"
        />
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Esta descripción aparecerá en el recuadro "OBSERVACIONES" de la cotización comercial emitida al cliente.
        </p>
      </div>
    </div>
  );
};
