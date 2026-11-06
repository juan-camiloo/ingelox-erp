import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Save,
  Printer,
  Eye,
  Plus,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import type { ShippingInstruction, ShippingInstructionConcept, ThirdParty } from '../types/commercial';
import { ShippingInstructionService, ThirdPartyService, QuotationService } from '../services/commercialService';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { useExcelGenerator } from '../hooks/useExcelGenerator';
import { buildInstructionHtml } from '../templates/instructionPdfTemplate';

const INCOTERMS = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
const VIAS = ['MARITIMO', 'AEREO', 'TERRESTRE'];
const TIPOS_EMBARQUE = ['EXPORTACION', 'IMPORTACION', 'NACIONAL', 'TRANSITO'];
const MODALIDADES = [
  'FCL / FCL', 'LCL / FCL', 'FCL / LCL', 'LCL / LCL',
  'Avión carguero', 'Avión de Pasajeros', 'RO-RO', 'Break Bulk',
  'Reefer 40’', 'FTL / FTL', 'LTL / LTL', 'OTM', 'DTA',
  'Carga nacionalizada', 'Solo liberación', 'Solo seguro', 'Solo aduana'
];
const CREDITOS = [
  { val: 'SI-7', label: 'Sí - 7 días' },
  { val: 'SI-15', label: 'Sí - 15 días' },
  { val: 'SI-30', label: 'Sí - 30 días' },
  { val: 'NO', label: 'No' },
  { val: 'PENDIENTE', label: 'Pendiente de aprobación' },
];

import { useSearchParams } from 'react-router-dom';
import { saveFormDraft, loadFormDraft, clearFormDraft } from '../lib/draftStorage';

export const InstructionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const quotationId = searchParams.get('quotationId');

  const { printHtml, previewHtml } = usePdfGenerator();
  const { exportInstructionToExcel, isExporting } = useExcelGenerator();

  const [instructionId, setInstructionId] = useState(() => editId || `inst-${Date.now()}`);
  const [isEditing, setIsEditing] = useState(Boolean(editId));
  const [draftRestored, setDraftRestored] = useState(false);

  const [doNumber, setDoNumber] = useState('');
  const [fechaCreacion, setFechaCreacion] = useState(new Date().toISOString().split('T')[0]);
  const [comercial, setComercial] = useState('');
  const [oferta, setOferta] = useState('');
  const [cliente, setCliente] = useState('');
  const [credito, setCredito] = useState('SI-30');
  const [contacto, setContacto] = useState('');
  const [facturarA, setFacturarA] = useState('CLIENTE');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');

  // Embarque
  const [incoterm, setIncoterm] = useState('FOB');
  const [complemento, setComplemento] = useState('');
  const [modalidad, setModalidad] = useState('FCL / FCL');
  const [ruta, setRuta] = useState('');
  const [via, setVia] = useState('MARITIMO');
  const [tipoEmbarque, setTipoEmbarque] = useState('EXPORTACION');
  const [comentarios, setComentarios] = useState('');
  const [estado, setEstado] = useState<'borrador' | 'finalizada'>('borrador');

  // Terceros para autocompletar
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);

  // Conceptos
  const [concepts, setConcepts] = useState<ShippingInstructionConcept[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const parties = await ThirdPartyService.getThirdParties();
      setThirdParties(parties);

      // Si viene desde una Cotización, autocompletar datos y conceptos
      if (quotationId) {
        const quote = await QuotationService.getQuotationById(quotationId);
        if (quote) {
          setOferta(quote.consecutivo);
          setCliente(quote.cliente_nombre);
          setComercial(quote.vendedor || 'LUENGAS ACOSTA DANIEL ARTURO');
          setContacto(quote.atencion || '');
          setTelefono(quote.cliente_telefono || '');
          setComentarios(quote.observaciones || '');

          if (quote.forma_pago?.includes('30')) setCredito('SI-30');
          else if (quote.forma_pago?.includes('15')) setCredito('SI-15');
          else if (quote.forma_pago?.includes('7')) setCredito('SI-7');

          // Generar conceptos desde los ítems de la cotización
          if (quote.items && quote.items.length > 0) {
            const mappedConcepts: ShippingInstructionConcept[] = quote.items.map((it, idx) => ({
              id: `c-${Date.now()}-${idx}`,
              orden: idx + 1,
              concepto: it.concepto,
              vendido: 1,
              proveedor: it.concepto.toLowerCase().includes('ingelox') ? 'Ingelox Logistics SAS' : '',
              forma_pago: 'Prepaid',
              costo: '',
              moneda_costo: quote.moneda || 'USD',
              venta: String(it.valor_unitario),
              moneda_venta: quote.moneda || 'USD',
              facturar_a: quote.cliente_nombre,
            }));
            setConcepts(mappedConcepts);
          }
        }
      } else if (editId) {
        // Cargar instrucción para edición
        const existing = await ShippingInstructionService.getInstructionById(editId);
        if (existing) {
          setIsEditing(true);
          setInstructionId(existing.id);
          setDoNumber(existing.do_number);
          setFechaCreacion(existing.fecha_creacion);
          setComercial(existing.comercial);
          setOferta(existing.oferta);
          setCliente(existing.cliente);
          setCredito(existing.credito);
          setContacto(existing.contacto);
          setFacturarA(existing.facturar_a);
          setTelefono(existing.telefono);
          setCorreo(existing.correo);
          setIncoterm(existing.incoterm);
          setComplemento(existing.complemento);
          setModalidad(existing.modalidad);
          setRuta(existing.ruta);
          setVia(existing.via);
          setTipoEmbarque(existing.tipo_de_embarque);
          setComentarios(existing.comentarios);
          setEstado(existing.estado);
          if (existing.concepts && existing.concepts.length > 0) {
            setConcepts(existing.concepts);
          }
        }
      } else {
        // Restaurar borrador de instrucción si existe
        const draft = loadFormDraft<any>('instruction_create');
        if (draft) {
          if (draft.doNumber) setDoNumber(draft.doNumber);
          if (draft.fechaCreacion) setFechaCreacion(draft.fechaCreacion);
          if (draft.comercial) setComercial(draft.comercial);
          if (draft.oferta) setOferta(draft.oferta);
          if (draft.cliente) setCliente(draft.cliente);
          if (draft.credito) setCredito(draft.credito);
          if (draft.contacto) setContacto(draft.contacto);
          if (draft.facturarA) setFacturarA(draft.facturarA);
          if (draft.telefono) setTelefono(draft.telefono);
          if (draft.correo) setCorreo(draft.correo);
          if (draft.incoterm) setIncoterm(draft.incoterm);
          if (draft.complemento) setComplemento(draft.complemento);
          if (draft.modalidad) setModalidad(draft.modalidad);
          if (draft.ruta) setRuta(draft.ruta);
          if (draft.via) setVia(draft.via);
          if (draft.tipoEmbarque) setTipoEmbarque(draft.tipoEmbarque);
          if (draft.comentarios) setComentarios(draft.comentarios);
          if (draft.estado) setEstado(draft.estado);
          if (draft.concepts && draft.concepts.length > 0) setConcepts(draft.concepts);
          setDraftRestored(true);
        }
      }
    }
    load();
  }, [quotationId, editId]);

  // Auto-guardado de borrador en sessionStorage
  useEffect(() => {
    if (editId || quotationId) return;
    if (!doNumber && !cliente && !ruta) return;
    saveFormDraft('instruction_create', {
      doNumber,
      fechaCreacion,
      comercial,
      oferta,
      cliente,
      credito,
      contacto,
      facturarA,
      telefono,
      correo,
      incoterm,
      complemento,
      modalidad,
      ruta,
      via,
      tipoEmbarque,
      comentarios,
      estado,
      concepts,
    });
  }, [editId, quotationId, doNumber, fechaCreacion, comercial, oferta, cliente, credito, contacto, facturarA, telefono, correo, incoterm, complemento, modalidad, ruta, via, tipoEmbarque, comentarios, estado, concepts]);

  const handleSelectThirdParty = (tp: ThirdParty) => {
    setCliente(tp.razon_social);
    setTelefono(tp.telefono || '');
    setCorreo(tp.email || tp.correo_fe || '');
    if (tp.vendedor) setComercial(tp.vendedor);
    if (tp.dias_credito > 0) {
      setCredito(tp.dias_credito >= 30 ? 'SI-30' : tp.dias_credito >= 15 ? 'SI-15' : 'SI-7');
    } else {
      setCredito('NO');
    }
  };

  const handleAddConcept = () => {
    const newConcept: ShippingInstructionConcept = {
      id: String(Date.now()),
      orden: concepts.length + 1,
      concepto: '',
      vendido: 1,
      proveedor: '',
      forma_pago: 'Prepaid',
      costo: '',
      moneda_costo: 'USD',
      venta: '',
      moneda_venta: 'USD',
      facturar_a: 'CLIENTE',
    };
    setConcepts([...concepts, newConcept]);
  };

  const handleRemoveConcept = (idx: number) => {
    setConcepts(concepts.filter((_, i) => i !== idx));
  };

  const handleConceptChange = (idx: number, field: keyof ShippingInstructionConcept, val: any) => {
    const updated = [...concepts];
    updated[idx] = { ...updated[idx], [field]: val };
    setConcepts(updated);
  };

  const currentInstructionObject: ShippingInstruction = {
    id: instructionId,
    do_number: doNumber,
    fecha_creacion: fechaCreacion,
    comercial,
    oferta,
    cliente,
    credito,
    contacto,
    facturar_a: facturarA,
    telefono,
    correo,
    incoterm,
    complemento,
    modalidad,
    ruta,
    via,
    tipo_de_embarque: tipoEmbarque,
    comentarios,
    estado,
    concepts,
  };

  const handleSave = async () => {
    if (!doNumber.trim() || !cliente.trim()) {
      alert('Debes indicar el número de DO y el cliente.');
      return;
    }

    setSaving(true);
    try {
      await ShippingInstructionService.saveInstruction(currentInstructionObject);
      clearFormDraft('instruction_create');
      navigate('/instructions');
    } catch (err: any) {
      alert(err.message || 'Error al guardar la instrucción');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewPdf = () => {
    const html = buildInstructionHtml(currentInstructionObject, concepts);
    previewHtml(html, `Instrucción ${doNumber}`);
  };

  const handlePrintPdf = () => {
    const html = buildInstructionHtml(currentInstructionObject, concepts);
    printHtml(html, { title: `Instrucción ${doNumber}`, orientation: 'landscape' });
  };

  const handleExportExcel = async () => {
    await exportInstructionToExcel(currentInstructionObject, concepts);
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/instructions')}
            className="erp-btn-secondary p-2"
            aria-label="Volver a instrucciones"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="erp-page-title">
              {isEditing ? `Editar Instrucción ${doNumber || ''}` : `Nueva Instrucción ${doNumber ? doNumber : ''}`.trim()}
            </h1>
            <p className="erp-page-subtitle">
              Directrices operativas de transporte, itinerarios y conceptos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => navigate(`/shipments/new?instructionId=${encodeURIComponent(instructionId)}`)}
            className="erp-btn-secondary"
            title="Crear o vincular expediente en Control de Tráfico"
          >
            <span className="text-blue-500 font-bold">DO</span>
            <span className="hidden sm:inline">Abrir en Tráfico</span>
          </button>
          <button onClick={handlePreviewPdf} className="erp-btn-secondary">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Vista Previa</span>
          </button>
          <button onClick={handlePrintPdf} className="erp-btn-secondary">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir PDF</span>
          </button>
          <button onClick={handleExportExcel} disabled={isExporting} className="erp-btn-secondary">
            <FileSpreadsheet className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
            <span className="hidden sm:inline">Excel (.xlsx)</span>
          </button>
          <button onClick={handleSave} disabled={saving} className="erp-btn-primary">
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {draftRestored && (
        <div className="erp-badge-emerald w-full p-3 rounded-xl flex items-center justify-between text-xs">
          <span>Borrador de instrucción de embarque recuperado automáticamente. Tu avance está seguro.</span>
          <button
            type="button"
            onClick={() => {
              clearFormDraft('instruction_create');
              setDraftRestored(false);
            }}
            className="underline cursor-pointer text-[10px] ml-3 text-emerald-700 dark:text-emerald-300"
          >
            Descartar borrador
          </button>
        </div>
      )}

      {/* SECCIÓN 1: DATOS GENERALES */}
      <div className="erp-card space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider pb-2" style={{ color: 'var(--brand-orange-text)', borderBottom: '1px solid var(--border-default)' }}>
          1. Datos Generales de la Instrucción
        </h2>

        <div className="erp-card-subtle space-y-2">
          <label className="erp-label">Autocompletar Cliente desde Directorio de Terceros</label>
          <select
            onChange={(e) => {
              const found = thirdParties.find((p) => p.id === e.target.value);
              if (found) handleSelectThirdParty(found);
            }}
            className="erp-select"
          >
            <option value="">-- Seleccionar cliente --</option>
            {thirdParties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.razon_social} (NIT: {p.identificacion})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="erp-label">Número DO *</label>
            <input
              type="text"
              placeholder="Ej: DO-2609-01 o X26666"
              value={doNumber}
              onChange={(e) => setDoNumber(e.target.value.toUpperCase())}
              required
              className="erp-input font-mono font-bold"
              style={{ color: 'var(--brand-orange)' }}
            />
          </div>
          <div>
            <label className="erp-label">Fecha de Creación</label>
            <input
              type="date"
              value={fechaCreacion}
              onChange={(e) => setFechaCreacion(e.target.value)}
              className="erp-input"
            />
          </div>
          <div>
            <label className="erp-label"># Cotización</label>
            <input
              type="text"
              placeholder="Ej: CS-2609-7"
              value={oferta}
              onChange={(e) => setOferta(e.target.value)}
              className="erp-input font-mono"
            />
          </div>
          <div>
            <label className="erp-label">Estado de la Instrucción</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              className="erp-select font-semibold"
            >
              <option value="borrador">Borrador</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="erp-label">Cliente / Razón Social *</label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              required
              className="erp-input uppercase font-semibold"
            />
          </div>
          <div>
            <label className="erp-label">Crédito Aprobado</label>
            <select
              value={credito}
              onChange={(e) => setCredito(e.target.value)}
              className="erp-select"
            >
              {CREDITOS.map((c) => (
                <option key={c.val} value={c.val}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
          <div>
            <label className="erp-label">Contacto Operativo</label>
            <input
              type="text"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              className="erp-input"
            />
          </div>
          <div>
            <label className="erp-label">Asesor Comercial</label>
            <input
              type="text"
              value={comercial}
              onChange={(e) => setComercial(e.target.value)}
              className="erp-input uppercase"
            />
          </div>
          <div>
            <label className="erp-label">Teléfono</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="erp-input font-mono"
            />
          </div>
          <div>
            <label className="erp-label">Correo de Notificaciones</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="erp-input"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: INFORMACIÓN DEL EMBARQUE */}
      <div className="erp-card space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider pb-2" style={{ color: 'var(--brand-orange-text)', borderBottom: '1px solid var(--border-default)' }}>
          2. Parámetros de Embarque y Transporte
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="erp-label">Incoterm</label>
            <select
              value={incoterm}
              onChange={(e) => setIncoterm(e.target.value)}
              className="erp-select font-bold"
            >
              {INCOTERMS.map((inc) => (
                <option key={inc} value={inc}>{inc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="erp-label">Vía de Transporte</label>
            <select
              value={via}
              onChange={(e) => setVia(e.target.value)}
              className="erp-select font-bold"
            >
              {VIAS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="erp-label">Tipo de Embarque</label>
            <select
              value={tipoEmbarque}
              onChange={(e) => setTipoEmbarque(e.target.value)}
              className="erp-select font-bold"
            >
              {TIPOS_EMBARQUE.map((te) => (
                <option key={te} value={te}>{te}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="erp-label">Modalidad (17 Modalidades)</label>
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              className="erp-select font-semibold"
            >
              {MODALIDADES.map((mod) => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="erp-label">Ruta (Origen - Destino)</label>
            <input
              type="text"
              placeholder="Ej: BOG - GDL o SHA - BOG"
              value={ruta}
              onChange={(e) => setRuta(e.target.value.toUpperCase())}
              className="erp-input uppercase font-mono font-semibold"
            />
          </div>
          <div>
            <label className="erp-label">Complemento Lugar de Entrega</label>
            <input
              type="text"
              placeholder="Ej: AEROPUERTO EL DORADO"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              className="erp-input uppercase"
            />
          </div>
        </div>

        <div>
          <label className="erp-label">Facturar a</label>
          <input
            type="text"
            value={facturarA}
            onChange={(e) => setFacturarA(e.target.value)}
            className="erp-input uppercase font-semibold"
          />
        </div>
      </div>

      {/* SECCIÓN 3: TABLA DE CONCEPTOS DE OPERACIONES */}
      <div className="erp-card space-y-4">
        <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-orange-text)' }}>
            3. Instrucciones de Operaciones & Costeo
          </h2>
          <button onClick={handleAddConcept} className="erp-btn-primary py-1 px-3 text-[11px]">
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Concepto</span>
          </button>
        </div>

        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="erp-th text-left">Concepto</th>
                <th className="erp-th text-center w-14">Vendido</th>
                <th className="erp-th text-left">Proveedor</th>
                <th className="erp-th text-center w-24">Pago</th>
                <th className="erp-th text-right w-24">Costo</th>
                <th className="erp-th text-center w-16">Moneda</th>
                <th className="erp-th text-right w-24">Venta</th>
                <th className="erp-th text-left w-36">Facturar A</th>
                <th className="erp-th text-center w-10"></th>
              </tr>
            </thead>
            <tbody>
              {concepts.map((item, index) => (
                <tr key={item.id} className="erp-tr">
                  <td className="erp-td">
                    <input
                      type="text"
                      placeholder="Concepto..."
                      value={item.concepto}
                      onChange={(e) => handleConceptChange(index, 'concepto', e.target.value)}
                      className="erp-input p-1 font-bold text-xs"
                    />
                  </td>
                  <td className="erp-td text-center">
                    <select
                      value={item.vendido}
                      onChange={(e) => handleConceptChange(index, 'vendido', parseInt(e.target.value, 10))}
                      className="erp-select p-1 text-center font-bold text-xs"
                    >
                      <option value={1}>S</option>
                      <option value={0}>N</option>
                    </select>
                  </td>
                  <td className="erp-td">
                    <input
                      type="text"
                      placeholder="Naviera/Aerolínea/Transportador"
                      value={item.proveedor || ''}
                      onChange={(e) => handleConceptChange(index, 'proveedor', e.target.value)}
                      className="erp-input p-1 text-xs"
                    />
                  </td>
                  <td className="erp-td text-center">
                    <select
                      value={item.forma_pago || 'Prepaid'}
                      onChange={(e) => handleConceptChange(index, 'forma_pago', e.target.value)}
                      className="erp-select p-1 text-center font-semibold text-xs"
                    >
                      <option value="Prepaid">Prepaid</option>
                      <option value="Collect">Collect</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>
                  <td className="erp-td text-right">
                    <input
                      type="text"
                      placeholder="0.00"
                      value={item.costo || ''}
                      onChange={(e) => handleConceptChange(index, 'costo', e.target.value)}
                      className="erp-input p-1 text-right font-mono text-xs"
                    />
                  </td>
                  <td className="erp-td text-center">
                    <select
                      value={item.moneda_costo || 'USD'}
                      onChange={(e) => handleConceptChange(index, 'moneda_costo', e.target.value)}
                      className="erp-select p-1 font-mono text-center text-xs"
                    >
                      <option value="USD">USD</option>
                      <option value="COP">COP</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </td>
                  <td className="erp-td text-right">
                    <input
                      type="text"
                      placeholder="0.00"
                      value={item.venta || ''}
                      onChange={(e) => handleConceptChange(index, 'venta', e.target.value)}
                      className="erp-input p-1 text-right font-mono font-bold text-xs"
                      style={{ color: 'var(--color-success)' }}
                    />
                  </td>
                  <td className="erp-td">
                    <input
                      type="text"
                      value={item.facturar_a || ''}
                      onChange={(e) => handleConceptChange(index, 'facturar_a', e.target.value)}
                      className="erp-input p-1 text-xs"
                    />
                  </td>
                  <td className="erp-td text-center">
                    <button
                      onClick={() => handleRemoveConcept(index)}
                      className="erp-icon-btn hover:text-rose-500"
                      title="Eliminar concepto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 4: COMENTARIOS ADICIONALES */}
      <div className="erp-card space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--brand-orange-text)' }}>
          4. Observaciones e Instrucciones Adicionales
        </h2>
        <textarea
          rows={4}
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Comentarios libres para el despachador de tráfico o transportador..."
          className="erp-textarea font-mono"
        />
      </div>
    </div>
  );
};
