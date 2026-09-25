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
import type { ShippingInstruction, ShippingInstructionConcept, ThirdParty } from '../types/practiko';
import { ShippingInstructionService, PractikoThirdPartyService } from '../services/practikoService';
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

export const InstructionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { printHtml, previewHtml } = usePdfGenerator();
  const { exportInstructionToExcel, isExporting } = useExcelGenerator();

  const [doNumber, setDoNumber] = useState('');
  const [fechaCreacion, setFechaCreacion] = useState(new Date().toISOString().split('T')[0]);
  const [comercial, setComercial] = useState('LUENGAS ACOSTA DANIEL ARTURO');
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
  const [concepts, setConcepts] = useState<ShippingInstructionConcept[]>([
    { id: '1', orden: 1, concepto: 'Flete Internacional', vendido: 1, proveedor: '', forma_pago: 'Prepaid', costo: '', moneda_costo: 'USD', venta: '', moneda_venta: 'USD', facturar_a: 'CLIENTE' },
    { id: '2', orden: 2, concepto: 'Manejo Ingelox', vendido: 1, proveedor: 'Ingelox Logistics SAS', forma_pago: 'Prepaid', costo: '', moneda_costo: 'USD', venta: '', moneda_venta: 'USD', facturar_a: 'CLIENTE' },
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const parties = await PractikoThirdPartyService.getThirdParties();
      setThirdParties(parties);
    }
    load();
  }, []);

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
    id: `inst-${Date.now()}`,
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
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/instructions')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Nueva Instrucción de Embarque
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                {doNumber || 'SIN DO'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Emisión de directrices operativas de tráfico, proveedores y conceptos con exportación a Excel oficial.
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
          <button onClick={handleExportExcel} disabled={isExporting} className="erp-btn-secondary">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>
          <button onClick={handleSave} disabled={saving} className="erp-btn-primary">
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: DATOS GENERALES */}
      <div className="erp-card space-y-4">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
          1. Datos Generales de la Instrucción
        </h2>

        <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2">
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="erp-label">Número DO *</label>
            <input
              type="text"
              placeholder="Ej: DO-2609-01 o X26666"
              value={doNumber}
              onChange={(e) => setDoNumber(e.target.value.toUpperCase())}
              required
              className="erp-input font-mono font-bold text-brand-orange"
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
            <label className="erp-label"># Oferta / Cotización</label>
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
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
            <label className="erp-label">Correo Notificaciones</label>
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
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
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
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            3. Instrucciones de Operaciones & Costeo
          </h2>
          <button onClick={handleAddConcept} className="erp-btn-primary py-1 text-[11px]">
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Concepto</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-bold">
                <th className="p-2 text-left">Concepto</th>
                <th className="p-2 text-center w-14">Vendido</th>
                <th className="p-2 text-left">Proveedor</th>
                <th className="p-2 text-center w-24">Pago</th>
                <th className="p-2 text-right w-24">Costo</th>
                <th className="p-2 text-center w-16">Moneda</th>
                <th className="p-2 text-right w-24">Venta</th>
                <th className="p-2 text-left w-36">Facturar A</th>
                <th className="p-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {concepts.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="p-1.5">
                    <input
                      type="text"
                      placeholder="Concepto..."
                      value={item.concepto}
                      onChange={(e) => handleConceptChange(index, 'concepto', e.target.value)}
                      className="erp-input p-1 font-bold text-white"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <select
                      value={item.vendido}
                      onChange={(e) => handleConceptChange(index, 'vendido', parseInt(e.target.value, 10))}
                      className="erp-select p-1 text-center font-bold"
                    >
                      <option value={1}>S</option>
                      <option value={0}>N</option>
                    </select>
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      placeholder="Naviera/Aerolínea/Transportador"
                      value={item.proveedor || ''}
                      onChange={(e) => handleConceptChange(index, 'proveedor', e.target.value)}
                      className="erp-input p-1"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <select
                      value={item.forma_pago || 'Prepaid'}
                      onChange={(e) => handleConceptChange(index, 'forma_pago', e.target.value)}
                      className="erp-select p-1 text-center font-semibold"
                    >
                      <option value="Prepaid">Prepaid</option>
                      <option value="Collect">Collect</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>
                  <td className="p-1.5 text-right">
                    <input
                      type="text"
                      placeholder="0.00"
                      value={item.costo || ''}
                      onChange={(e) => handleConceptChange(index, 'costo', e.target.value)}
                      className="erp-input p-1 text-right font-mono"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <select
                      value={item.moneda_costo || 'USD'}
                      onChange={(e) => handleConceptChange(index, 'moneda_costo', e.target.value)}
                      className="erp-select p-1 font-mono text-center"
                    >
                      <option value="USD">USD</option>
                      <option value="COP">COP</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </td>
                  <td className="p-1.5 text-right">
                    <input
                      type="text"
                      placeholder="0.00"
                      value={item.venta || ''}
                      onChange={(e) => handleConceptChange(index, 'venta', e.target.value)}
                      className="erp-input p-1 text-right font-mono font-bold text-emerald-400"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={item.facturar_a || ''}
                      onChange={(e) => handleConceptChange(index, 'facturar_a', e.target.value)}
                      className="erp-input p-1"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      onClick={() => handleRemoveConcept(index)}
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
      </div>

      {/* SECCIÓN 4: COMENTARIOS ADICIONALES */}
      <div className="erp-card space-y-3">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
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
