import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  MapPin,
  X,
  UserCheck,
  Briefcase,
  Save,
  Edit2,
} from 'lucide-react';
import type { ThirdParty, TipoPersona, TipoId } from '../types/commercial';
import { ThirdPartyService } from '../services/commercialService';
import { calculateNitDv, formatNit } from '../lib/nitUtils';
import { saveFormDraft, loadFormDraft, clearFormDraft } from '../lib/draftStorage';
import { MarqueeText } from '../components/common/MarqueeText';
import { PreviewPill } from '../components/common/PreviewPill';

export const ThirdPartiesPage: React.FC = () => {
  const [parties, setParties] = useState<ThirdParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'clientes' | 'proveedores'>('all');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingParty, setEditingParty] = useState<ThirdParty | null>(null);

  // Form fields
  const [tipoPersona, setTipoPersona] = useState<TipoPersona>('juridica');
  const [tipoId, setTipoId] = useState<TipoId>('NIT');
  const [identificacion, setIdentificacion] = useState('');
  const [dv, setDv] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState('');

  // Ubicación y contacto
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pais, setPais] = useState('Colombia');
  const [ciudad, setCiudad] = useState('Bogotá D.C.');
  const [correoFe, setCorreoFe] = useState('');
  const [nombreSucursal, setNombreSucursal] = useState('PRINCIPAL');
  const [nombreContacto, setNombreContacto] = useState('');

  // Datos adicionales
  const [vendedor, setVendedor] = useState('');
  const [diasCredito, setDiasCredito] = useState(0);
  const [email, setEmail] = useState('');
  const [autorizaEmail, setAutorizaEmail] = useState(true);

  // Clasificación de tercero
  const [esCliente, setEsCliente] = useState(true);
  const [esProveedor, setEsProveedor] = useState(false);
  const [esEmpleado, setEsEmpleado] = useState(false);
  const [esSocio, setEsSocio] = useState(false);
  const [esVendedor, setEsVendedor] = useState(false);
  const [otros, setOtros] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadParties = async () => {
    setLoading(true);
    try {
      const data = await ThirdPartyService.getThirdParties();
      setParties(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  // Auto-guardado de borrador mientras el modal de creación esté abierto
  useEffect(() => {
    if (showModal && !editingParty) {
      saveFormDraft('third_party_create', {
        tipoPersona, tipoId, identificacion, dv, razonSocial,
        primerApellido, segundoApellido, primerNombre, segundoNombre,
        direccion, telefono, pais, ciudad, correoFe, nombreSucursal, nombreContacto,
        vendedor, diasCredito, email, autorizaEmail,
        esCliente, esProveedor, esEmpleado, esVendedor,
      });
    }
  }, [
    showModal, editingParty, tipoPersona, tipoId, identificacion, dv, razonSocial,
    primerApellido, segundoApellido, primerNombre, segundoNombre,
    direccion, telefono, pais, ciudad, correoFe, nombreSucursal, nombreContacto,
    vendedor, diasCredito, email, autorizaEmail,
    esCliente, esProveedor, esEmpleado, esVendedor,
  ]);

  const handleIdentificacionChange = (val: string) => {
    setIdentificacion(val);
    if (tipoId === 'NIT' && val.trim().length >= 5) {
      const computedDv = calculateNitDv(val.trim());
      setDv(computedDv);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingParty(null);
    const draft = loadFormDraft<any>('third_party_create');
    if (draft && (draft.identificacion || draft.razonSocial || draft.direccion)) {
      setTipoPersona(draft.tipoPersona || 'juridica');
      setTipoId(draft.tipoId || 'NIT');
      setIdentificacion(draft.identificacion || '');
      setDv(draft.dv || '');
      setRazonSocial(draft.razonSocial || '');
      setPrimerApellido(draft.primerApellido || '');
      setSegundoApellido(draft.segundoApellido || '');
      setPrimerNombre(draft.primerNombre || '');
      setSegundoNombre(draft.segundoNombre || '');
      setFechaRegistro(new Date().toISOString().split('T')[0]);
      setDireccion(draft.direccion || '');
      setTelefono(draft.telefono || '');
      setPais(draft.pais || 'Colombia');
      setCiudad(draft.ciudad || 'Bogotá D.C.');
      setCorreoFe(draft.correoFe || '');
      setNombreSucursal(draft.nombreSucursal || 'PRINCIPAL');
      setNombreContacto(draft.nombreContacto || '');
      setVendedor(draft.vendedor || '');
      setDiasCredito(draft.diasCredito ?? 0);
      setEmail(draft.email || '');
      setAutorizaEmail(draft.autorizaEmail ?? true);
      setEsCliente(draft.esCliente ?? true);
      setEsProveedor(draft.esProveedor ?? false);
      setEsEmpleado(draft.esEmpleado ?? false);
      setEsVendedor(draft.esVendedor ?? false);
    } else {
      setTipoPersona('juridica');
      setTipoId('NIT');
      setIdentificacion('');
      setDv('');
      setRazonSocial('');
      setPrimerApellido('');
      setSegundoApellido('');
      setPrimerNombre('');
      setSegundoNombre('');
      setFechaRegistro(new Date().toISOString().split('T')[0]);
      setDireccion('');
      setTelefono('');
      setPais('Colombia');
      setCiudad('Bogotá D.C.');
      setCorreoFe('');
      setNombreSucursal('PRINCIPAL');
      setNombreContacto('');
      setVendedor('');
      setDiasCredito(0);
      setEmail('');
      setAutorizaEmail(true);
      setEsCliente(true);
      setEsProveedor(false);
      setEsEmpleado(false);
      setEsSocio(false);
      setEsVendedor(false);
      setOtros(false);
    }
    setFeedbackMsg(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (p: ThirdParty) => {
    setEditingParty(p);
    setTipoPersona(p.tipo_persona);
    setTipoId(p.tipo_id);
    setIdentificacion(p.identificacion);
    setDv(p.dv || '');
    setRazonSocial(p.razon_social);
    setPrimerApellido(p.primer_apellido || '');
    setSegundoApellido(p.segundo_apellido || '');
    setPrimerNombre(p.primer_nombre || '');
    setSegundoNombre(p.segundo_nombre || '');
    setFechaRegistro(p.fecha_registro || '');
    setDireccion(p.direccion || '');
    setTelefono(p.telefono || '');
    setPais(p.pais || 'Colombia');
    setCiudad(p.ciudad || 'Bogotá D.C.');
    setCorreoFe(p.correo_fe || '');
    setNombreSucursal(p.nombre_sucursal || 'PRINCIPAL');
    setNombreContacto(p.contact_name || p.nombre_contacto || '');
    setVendedor(p.vendedor || '');
    setDiasCredito(p.dias_credito || 0);
    setEmail(p.email || '');
    setAutorizaEmail(p.autoriza_email);
    setEsCliente(p.es_cliente);
    setEsProveedor(p.es_proveedor);
    setEsEmpleado(p.es_empleado);
    setEsSocio(p.es_socio);
    setEsVendedor(p.es_vendedor);
    setOtros(p.otros);
    setFeedbackMsg(null);
    setShowModal(true);
  };

  const handleSaveThirdParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificacion.trim()) {
      setFeedbackMsg({ type: 'error', text: 'El número de identificación es obligatorio.' });
      return;
    }

    const calculatedRazonSocial =
      tipoPersona === 'juridica'
        ? razonSocial.trim().toUpperCase()
        : `${primerApellido} ${segundoApellido} ${primerNombre} ${segundoNombre}`.trim().toUpperCase();

    if (!calculatedRazonSocial) {
      setFeedbackMsg({ type: 'error', text: 'El nombre o razón social es obligatorio.' });
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);

    const payload: Omit<ThirdParty, 'id'> = {
      tipo_persona: tipoPersona,
      tipo_id: tipoId,
      identificacion: identificacion.trim(),
      dv: dv.trim() || '',
      razon_social: calculatedRazonSocial,
      primer_apellido: primerApellido.trim() || null,
      segundo_apellido: segundoApellido.trim() || null,
      primer_nombre: primerNombre.trim() || null,
      segundo_nombre: segundoNombre.trim() || null,
      fecha_registro: fechaRegistro || new Date().toISOString().split('T')[0],
      direccion: direccion.trim() || '',
      telefono: telefono.trim() || '',
      pais: pais.trim() || 'Colombia',
      ciudad: ciudad.trim() || 'Bogotá D.C.',
      correo_fe: correoFe.trim() || '',
      nombre_sucursal: nombreSucursal.trim() || 'PRINCIPAL',
      contact_name: nombreContacto.trim() || null,
      nombre_contacto: nombreContacto.trim() || null,
      vendedor: vendedor.trim() || null,
      dias_credito: Number(diasCredito) || 0,
      email: email.trim() || '',
      autoriza_email: autorizaEmail,
      es_cliente: esCliente,
      es_proveedor: esProveedor,
      es_empleado: esEmpleado,
      es_socio: esSocio,
      es_vendedor: esVendedor,
      otros,
      status: 'active',
    };

    try {
      await ThirdPartyService.saveThirdParty({
        ...payload,
        id: editingParty?.id,
      });

      setShowModal(false);
      clearFormDraft('third_party_create');
      await loadParties();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error al guardar el tercero.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredParties = parties.filter((p) => {
    if (activeTabFilter === 'clientes' && !p.es_cliente) return false;
    if (activeTabFilter === 'proveedores' && !p.es_proveedor) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.razon_social.toLowerCase().includes(q) ||
      p.identificacion.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.ciudad.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="erp-page-title">Directorio de Terceros</h1>
          <p className="erp-page-subtitle">
            Registro unificado de clientes, proveedores y colaboradores.
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="erp-btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Crear Tercero</span>
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="erp-filter-bar">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTabFilter === 'all'
                ? 'erp-btn-primary'
                : 'erp-btn-ghost'
            }`}
          >
            Todos ({parties.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('clientes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTabFilter === 'clientes'
                ? 'erp-badge-orange'
                : 'erp-btn-ghost'
            }`}
          >
            Clientes
          </button>
          <button
            onClick={() => setActiveTabFilter('proveedores')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTabFilter === 'proveedores'
                ? 'erp-badge-blue'
                : 'erp-btn-ghost'
            }`}
          >
            Proveedores
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-disabled)' }}
          />
          <input
            type="text"
            placeholder="Buscar por NIT, razón social o ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="erp-search-input"
          />
        </div>
      </div>

      {/* TABLA DE TERCEROS */}
      <div className="erp-table-container">
        <table className="erp-table">
          <thead>
            <tr>
              <th className="erp-th">Identificación / NIT</th>
              <th className="erp-th">Razón Social / Nombre</th>
              <th className="erp-th">Contacto & Ubicación</th>
              <th className="erp-th">Correo Facturación</th>
              <th className="erp-th">Vendedor</th>
              <th className="erp-th">Crédito</th>
              <th className="erp-th">Tipo</th>
              <th className="erp-th text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  Cargando directorio de terceros...
                </td>
              </tr>
            ) : filteredParties.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No se encontraron terceros registrados con ese criterio.
                </td>
              </tr>
            ) : (
              filteredParties.map((party) => (
                <tr key={party.id} className="erp-tr group">
                  <td className="erp-td font-mono font-bold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {formatNit(party.identificacion, party.dv)}
                    <span className="ml-1 text-[10px] font-sans" style={{ color: 'var(--text-muted)' }}>({party.tipo_id})</span>
                  </td>
                  <td className="erp-td font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <div className="flex items-center gap-1.5 max-w-[240px]">
                      <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--brand-orange)' }} />
                      <MarqueeText
                        text={party.razon_social}
                        containerClassName="max-w-[210px]"
                        className="font-semibold"
                      />
                    </div>
                  </td>
                  <td className="erp-td whitespace-nowrap">
                    <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{party.ciudad}, {party.pais}</div>
                    <div className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Phone className="w-3 h-3" /> {party.telefono || '--'}
                    </div>
                  </td>
                  <td className="erp-td font-mono text-[11px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {party.correo_fe || party.email || '--'}
                  </td>
                  <td className="erp-td text-[11px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {party.vendedor || '--'}
                  </td>
                  <td className="erp-td whitespace-nowrap">
                    {party.dias_credito > 0 ? (
                      <span className="erp-badge-emerald whitespace-nowrap">{party.dias_credito} {party.dias_credito === 1 ? 'Día' : 'Días'}</span>
                    ) : (
                      <span className="erp-badge-slate whitespace-nowrap">Contado</span>
                    )}
                  </td>
                  <td className="erp-td whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {party.es_cliente && (
                        <PreviewPill
                          label="Cliente"
                          icon={UserCheck}
                          variant="orange"
                          title={`Ficha Comercial — ${party.razon_social}`}
                          subtitle={`NIT: ${formatNit(party.identificacion, party.dv)}`}
                          modalTitle={`Perfil de Cliente — ${party.razon_social}`}
                          emptyMessage="Sin parámetros adicionales."
                          items={[
                            {
                              id: 'vendedor',
                              title: party.vendedor || 'Sin Asesor Asignado',
                              subtitle: 'Asesor / Vendedor Comercial',
                              badge: { text: 'Comercial', variant: 'orange' },
                              icon: Briefcase,
                            },
                            {
                              id: 'credito',
                              title: party.dias_credito > 0 ? `${party.dias_credito} Días` : 'Contado',
                              subtitle: 'Condición de Pago',
                              badge: { text: party.dias_credito > 0 ? 'Crédito' : 'Contado', variant: 'emerald' },
                            },
                            {
                              id: 'correo',
                              title: party.correo_fe || party.email || 'Sin correo registrado',
                              subtitle: 'Facturación / Notificaciones',
                              badge: { text: 'Correo', variant: 'blue' },
                            },
                            {
                              id: 'contacto',
                              title: party.contact_name || party.nombre_contacto || party.telefono || 'Sin contacto directo',
                              subtitle: (party.contact_name || party.nombre_contacto) ? `Tel: ${party.telefono || '--'}` : `${party.ciudad || ''}, ${party.pais || ''}`,
                              badge: { text: 'Contacto', variant: 'slate' },
                              icon: Phone,
                            },
                          ]}
                        />
                      )}
                      {party.es_proveedor && (
                        <PreviewPill
                          label="Proveedor"
                          icon={Building2}
                          variant="blue"
                          title={`Ficha de Proveedor — ${party.razon_social}`}
                          subtitle={`NIT: ${formatNit(party.identificacion, party.dv)}`}
                          modalTitle={`Perfil de Proveedor — ${party.razon_social}`}
                          emptyMessage="Sin parámetros adicionales."
                          items={[
                            {
                              id: 'correo',
                              title: party.correo_fe || party.email || 'Sin correo registrado',
                              subtitle: 'Facturación / Contacto',
                              badge: { text: 'Correo', variant: 'blue' },
                            },
                            {
                              id: 'credito',
                              title: party.dias_credito > 0 ? `${party.dias_credito} Días` : 'Contado',
                              subtitle: 'Plazo de Pago',
                              badge: { text: party.dias_credito > 0 ? 'Crédito' : 'Contado', variant: 'emerald' },
                            },
                            {
                              id: 'contacto',
                              title: party.contact_name || party.nombre_contacto || party.telefono || 'Sin teléfono',
                              subtitle: (party.contact_name || party.nombre_contacto) ? `Tel: ${party.telefono || '--'}` : `${party.ciudad || ''}, ${party.pais || ''}`,
                              badge: { text: 'Contacto', variant: 'slate' },
                              icon: Phone,
                            },
                          ]}
                        />
                      )}
                    </div>
                  </td>
                  <td className="erp-td text-right whitespace-nowrap">
                    <div className="erp-action-group">
                      <button
                        onClick={() => handleOpenEditModal(party)}
                        className="erp-action-btn erp-action-btn-edit"
                        title="Editar información del tercero"
                        aria-label="Editar tercero"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR / EDITAR TERCERO */}
      {showModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="erp-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="erp-modal w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* 1. HEADER PINNED */}
            <div className="erp-modal-header">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: 'var(--brand-orange-dim)', color: 'var(--brand-orange)' }}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="erp-page-title text-base font-bold">
                    {editingParty ? 'Editar Tercero' : 'Crear Tercero'}
                  </h2>
                  <p className="erp-page-subtitle">
                    Registro comercial y facturación electrónica
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="erp-icon-btn p-2"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM WRAPPER WITH PINNED FOOTER & SCROLLABLE BODY */}
            <form onSubmit={handleSaveThirdParty} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* 2. BODY SCROLLABLE */}
              <div className="erp-modal-body space-y-4">
                {feedbackMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      feedbackMsg.type === 'error'
                        ? 'erp-badge-danger w-full justify-start'
                        : 'erp-badge-emerald w-full justify-start'
                    }`}
                  >
                    {feedbackMsg.text}
                  </div>
                )}

                {/* SECCIÓN 1: IDENTIFICACIÓN Y TIPO DE PERSONA */}
                <div className="erp-card-subtle p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--brand-orange-text)' }}>
                      <UserCheck className="w-4 h-4" /> Identificación y Tipo de Persona
                    </span>

                    {/* Segmented Switch for Persona */}
                    <div className="flex items-center gap-1 p-0.5 rounded-lg border" style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border-default)' }}>
                      <button
                        type="button"
                        onClick={() => setTipoPersona('juridica')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                          tipoPersona === 'juridica'
                            ? 'bg-[#F35815] text-white shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Jurídica
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoPersona('natural')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                          tipoPersona === 'natural'
                            ? 'bg-[#F35815] text-white shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Natural
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-3">
                      <label className="erp-label">Tipo de Id</label>
                      <select
                        value={tipoId}
                        onChange={(e) => setTipoId(e.target.value as TipoId)}
                        className="erp-select py-1.5 text-xs"
                      >
                        <option value="NIT">NIT</option>
                        <option value="CC">Cédula de Ciudadanía (CC)</option>
                        <option value="CE">Cédula de Extranjería (CE)</option>
                        <option value="PA">Pasaporte (PA)</option>
                        <option value="TI">Tarjeta de Identidad (TI)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="erp-label">Identificación / Número *</label>
                      <input
                        type="text"
                        placeholder="Ej: 830090754"
                        value={identificacion}
                        onChange={(e) => handleIdentificacionChange(e.target.value)}
                        required
                        className="erp-input py-1.5 text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="erp-label" title="Dígito de Verificación">DV</label>
                      <input
                        type="text"
                        maxLength={1}
                        value={dv}
                        onChange={(e) => setDv(e.target.value)}
                        className="erp-input py-1.5 text-xs text-center font-mono font-bold"
                      />
                    </div>

                    {tipoPersona === 'juridica' ? (
                      <div className="sm:col-span-4">
                        <label className="erp-label">Razón Social *</label>
                        <input
                          type="text"
                          placeholder="Ej: ALBAUGH COLOMBIA S.A.S."
                          value={razonSocial}
                          onChange={(e) => setRazonSocial(e.target.value)}
                          required
                          className="erp-input py-1.5 text-xs uppercase"
                        />
                      </div>
                    ) : (
                      <div className="sm:col-span-4">
                        <label className="erp-label">Fecha de Registro</label>
                        <input
                          type="date"
                          value={fechaRegistro}
                          onChange={(e) => setFechaRegistro(e.target.value)}
                          className="erp-input py-1.5 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {tipoPersona === 'natural' && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                      <div>
                        <label className="erp-label">Primer Apellido *</label>
                        <input
                          type="text"
                          value={primerApellido}
                          onChange={(e) => setPrimerApellido(e.target.value)}
                          required
                          className="erp-input py-1.5 text-xs uppercase"
                        />
                      </div>
                      <div>
                        <label className="erp-label">Segundo Apellido</label>
                        <input
                          type="text"
                          value={segundoApellido}
                          onChange={(e) => setSegundoApellido(e.target.value)}
                          className="erp-input py-1.5 text-xs uppercase"
                        />
                      </div>
                      <div>
                        <label className="erp-label">Primer Nombre *</label>
                        <input
                          type="text"
                          value={primerNombre}
                          onChange={(e) => setPrimerNombre(e.target.value)}
                          required
                          className="erp-input py-1.5 text-xs uppercase"
                        />
                      </div>
                      <div>
                        <label className="erp-label">Segundo Nombre</label>
                        <input
                          type="text"
                          value={segundoNombre}
                          onChange={(e) => setSegundoNombre(e.target.value)}
                          className="erp-input py-1.5 text-xs uppercase"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SECCIÓN 2: UBICACIÓN Y CONTACTO */}
                <div className="erp-card-subtle p-3.5 sm:p-4 space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-2" style={{ color: 'var(--brand-orange-text)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <MapPin className="w-4 h-4" /> Ubicación y Datos de Contacto
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-6">
                      <label className="erp-label">Dirección</label>
                      <input
                        type="text"
                        placeholder="Ej: CARRERA 22 NO. 98-82 OF 703"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        className="erp-input py-1.5 text-xs uppercase"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="erp-label">Ciudad</label>
                      <input
                        type="text"
                        placeholder="Bogotá D.C."
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        className="erp-input py-1.5 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="erp-label">País</label>
                      <input
                        type="text"
                        placeholder="Colombia"
                        value={pais}
                        onChange={(e) => setPais(e.target.value)}
                        className="erp-input py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-6">
                      <label className="erp-label">Nombre del Contacto</label>
                      <input
                        type="text"
                        placeholder="Ej: Juan Pérez"
                        value={nombreContacto}
                        onChange={(e) => setNombreContacto(e.target.value)}
                        className="erp-input py-1.5 text-xs uppercase"
                      />
                    </div>
                    <div className="sm:col-span-6">
                      <label className="erp-label">Correo de Facturación Electrónica</label>
                      <input
                        type="email"
                        placeholder="facturacion@empresa.com"
                        value={correoFe}
                        onChange={(e) => setCorreoFe(e.target.value)}
                        className="erp-input py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-6">
                      <label className="erp-label">Teléfono</label>
                      <input
                        type="text"
                        placeholder="573192156833"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        className="erp-input py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="sm:col-span-6">
                      <label className="erp-label">Sucursal</label>
                      <input
                        type="text"
                        placeholder="PRINCIPAL"
                        value={nombreSucursal}
                        onChange={(e) => setNombreSucursal(e.target.value)}
                        className="erp-input py-1.5 text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 3: DATOS COMERCIALES */}
                <div className="erp-card-subtle p-3.5 sm:p-4 space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-2" style={{ color: 'var(--brand-orange-text)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <Briefcase className="w-4 h-4" /> Datos Comerciales y Crédito
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5">
                      <label className="erp-label">Vendedor Comercial Asignado</label>
                      <input
                        type="text"
                        placeholder="Nombre del asesor comercial"
                        value={vendedor}
                        onChange={(e) => setVendedor(e.target.value)}
                        className="erp-input py-1.5 text-xs uppercase"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="erp-label">Días de Crédito</label>
                      <input
                        type="number"
                        min={0}
                        value={diasCredito}
                        onChange={(e) => setDiasCredito(parseInt(e.target.value, 10) || 0)}
                        className="erp-input py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="erp-label">Correo de Notificaciones</label>
                      <input
                        type="email"
                        placeholder="contacto@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="erp-input py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={autorizaEmail}
                        onChange={(e) => setAutorizaEmail(e.target.checked)}
                        className="rounded accent-[#F35815]"
                      />
                      <span>Autorizar envío de cotizaciones e instrucciones por correo electrónico</span>
                    </label>
                  </div>
                </div>

                {/* SECCIÓN 4: CLASIFICACIÓN DE TERCERO (INTERACTIVE CHIPS) */}
                <div className="erp-card-subtle p-3.5 sm:p-4 space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pb-2" style={{ color: 'var(--brand-orange-text)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <Users className="w-4 h-4" /> Clasificación del Tercero
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Cliente', checked: esCliente, setter: setEsCliente },
                      { label: 'Proveedor', checked: esProveedor, setter: setEsProveedor },
                      { label: 'Empleado', checked: esEmpleado, setter: setEsEmpleado },
                      { label: 'Vendedor', checked: esVendedor, setter: setEsVendedor },
                    ].map((item) => (
                      <label
                        key={item.label}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-all select-none ${
                          item.checked
                            ? 'border-[#F35815] bg-[#F35815]/10 text-[var(--brand-orange-text)] font-bold'
                            : 'border-[var(--border-default)] bg-[var(--surface-input)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => item.setter(e.target.checked)}
                          className="rounded accent-[#F35815]"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. FOOTER PINNED */}
              <div className="erp-modal-footer">
                <span className="text-[11px] mr-auto hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                  * Campos requeridos para expedición y recepción
                </span>
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
                  <span>{saving ? 'Guardando...' : 'Guardar Tercero'}</span>
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
