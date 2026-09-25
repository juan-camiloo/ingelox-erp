import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Printer,
  Eye,
  Plus,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import type { Quotation, QuotationItem, ThirdParty, BillingConcept } from '../types/practiko';
import {
  PractikoQuotationService,
  PractikoThirdPartyService,
  PractikoBillingConceptService,
} from '../services/practikoService';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { buildQuotationHtml } from '../templates/quotationPdfTemplate';

export const QuotationCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { printHtml, previewHtml } = usePdfGenerator();

  const [consecutivo, setConsecutivo] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [validez, setValidez] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [formaPago, setFormaPago] = useState('A 30 DIAS');
  const [vendedor, setVendedor] = useState('LUENGAS ACOSTA DANIEL ARTURO');
  const [atencion, setAtencion] = useState('');

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
  const [items, setItems] = useState<QuotationItem[]>([
    { id: '1', orden: 1, cantidad: 1, concepto: 'IN - FLETE AÉREO INTERNACIONAL', valor_unitario: 380, porcentaje_descuento: 0, subtotal: 380, iva: 0, total: 380 },
    { id: '2', orden: 2, cantidad: 1, concepto: 'IN - TRANSPORTE TERRESTRE URBANO', valor_unitario: 75, porcentaje_descuento: 0, subtotal: 75, iva: 0, total: 75 },
    { id: '3', orden: 3, cantidad: 1, concepto: 'IN - MANEJO INGELOX', valor_unitario: 75, porcentaje_descuento: 0, subtotal: 75, iva: 14.25, total: 89.25 },
  ]);

  const [moneda, setMoneda] = useState<'USD' | 'COP' | 'EUR'>('USD');
  const [observaciones, setObservaciones] = useState('EXP AEREA BOG - GDL 1 CAJA 25 KG IMO 9 UN3082 DIM: 42x40x50 cm');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const nextConsecutive = await PractikoQuotationService.generateNextConsecutive();
      setConsecutivo(nextConsecutive);

      const parties = await PractikoThirdPartyService.getThirdParties();
      setThirdParties(parties);

      const concepts = await PractikoBillingConceptService.getConcepts();
      setBillingConcepts(concepts);

      // Preseleccionar primer cliente si existe
      if (parties.length > 0) {
        handleSelectThirdParty(parties[0]);
      }
    }
    init();
  }, []);

  const handleSelectThirdParty = (p: ThirdParty) => {
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

    // Si cambia el concepto, autocompletar tarifa e IVA si coincide con el catálogo
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

    // Calcular IVA
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
    id: `quote-${Date.now()}`,
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
    estado: 'enviada',
    items,
  };

  const handleSave = async () => {
    if (!clienteNombre.trim() || items.length === 0) {
      alert('Debes indicar el cliente y al menos un concepto en la oferta.');
      return;
    }

    setSaving(true);
    try {
      await PractikoQuotationService.saveQuotation(currentQuotationObject);
      navigate('/quotations');
    } catch (err: any) {
      alert(err.message || 'Error al guardar cotización');
    } finally {
      setSaving(false);
    }
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
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Nueva Cotización Comercial
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-orange text-white">
                {consecutivo}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Generador oficial Practiko Carga con consecutivo automático y exportación formal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePreviewPdf} className="erp-btn-secondary">
            <Eye className="w-4 h-4" />
            <span>Vista Previa</span>
          </button>
          <button onClick={handlePrintPdf} className="erp-btn-secondary">
            <Printer className="w-4 h-4" />
            <span>Imprimir PDF</span>
          </button>
          <button onClick={handleSave} disabled={saving} className="erp-btn-primary">
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Oferta'}</span>
          </button>
        </div>
      </div>

      {/* FORMULARIO ENCABEZADO */}
      <div className="erp-card space-y-4">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
          1. Datos de la Propuesta & Cliente
        </h2>

        {/* SELECTOR DE TERCERO */}
        <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="erp-label">Consecutivo</label>
            <input
              type="text"
              value={consecutivo}
              onChange={(e) => setConsecutivo(e.target.value)}
              className="erp-input font-mono font-bold text-brand-orange"
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
            <label className="erp-label">Validez de Oferta</label>
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-800">
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
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            2. Conceptos Tarifarios & Servicios Cotizados
          </h2>
          <button onClick={handleAddItem} className="erp-btn-primary py-1 text-[11px]">
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Concepto</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-bold">
                <th className="p-2 text-center w-12">Cant</th>
                <th className="p-2 text-left">Concepto / Servicio</th>
                <th className="p-2 text-right w-28">Vr. Unitario</th>
                <th className="p-2 text-center w-20">% Dto</th>
                <th className="p-2 text-right w-28">Subtotal</th>
                <th className="p-2 text-right w-24">IVA</th>
                <th className="p-2 text-right w-28">Total</th>
                <th className="p-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="p-1.5 text-center">
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value) || 1)}
                      className="erp-input p-1 text-center font-mono w-12"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      list={`concepts-list-${index}`}
                      value={item.concepto}
                      onChange={(e) => handleItemChange(index, 'concepto', e.target.value)}
                      className="erp-input font-bold uppercase"
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
                  <td className="p-1.5 text-right">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.valor_unitario}
                      onChange={(e) => handleItemChange(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                      className="erp-input p-1 text-right font-mono"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.porcentaje_descuento}
                      onChange={(e) => handleItemChange(index, 'porcentaje_descuento', parseFloat(e.target.value) || 0)}
                      className="erp-input p-1 text-center font-mono w-16"
                    />
                  </td>
                  <td className="p-1.5 text-right font-mono font-semibold text-slate-300">
                    {item.subtotal.toLocaleString('es-CO')}
                  </td>
                  <td className="p-1.5 text-right">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.iva}
                      onChange={(e) => handleItemChange(index, 'iva', parseFloat(e.target.value) || 0)}
                      className="erp-input p-1 text-right font-mono text-slate-400"
                    />
                  </td>
                  <td className="p-1.5 text-right font-mono font-bold text-white">
                    {item.total.toLocaleString('es-CO')}
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-500 hover:text-rose-400 p-1"
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
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <div className="w-72 bg-slate-800/50 p-4 rounded-xl space-y-2 border border-slate-700/60 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal ({moneda}):</span>
              <span>{subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total IVA ({moneda}):</span>
              <span>{totalIva.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-sm border-t border-slate-700 pt-2">
              <span className="text-brand-orange">TOTAL OFERTA:</span>
              <span className="text-brand-orange">{moneda} {total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* OBSERVACIONES DEL EMBARQUE */}
      <div className="erp-card space-y-3">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          3. Observaciones Operativas de la Oferta
        </h2>
        <textarea
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Ej: EXP AEREA BOG - GDL 1 CAJA 25 KG IMO 9 UN3082 DIM: 42x40x50 cm"
          className="erp-textarea font-mono uppercase"
        />
        <p className="text-[10px] text-slate-400">
          Esta descripción aparecerá en el recuadro "OBSERVACIONES" de la cotización comercial emitida al cliente.
        </p>
      </div>
    </div>
  );
};
