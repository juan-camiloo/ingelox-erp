import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import type { ThirdParty, TipoPersona, TipoId } from '../types/practiko';
import { PractikoThirdPartyService } from '../services/practikoService';
import { calculateDianDv, formatColombianNit } from '../lib/dian';

export const ThirdPartiesPage: React.FC = () => {
  const [parties, setParties] = useState<ThirdParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'clientes' | 'proveedores'>('all');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingParty, setEditingParty] = useState<ThirdParty | null>(null);

  // Form fields (según formulario oficial de Practiko)
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

  // Datos adicionales
  const [vendedor, setVendedor] = useState('LUENGAS ACOSTA DANIEL ARTURO');
  const [diasCredito, setDiasCredito] = useState(30);
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
      const data = await PractikoThirdPartyService.getThirdParties();
      setParties(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  // Auto cálculo de DV al cambiar la identificación
  const handleIdentificacionChange = (val: string) => {
    setIdentificacion(val);
    if (tipoId === 'NIT' && val.trim().length >= 4) {
      const calculated = calculateDianDv(val);
      setDv(calculated);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingParty(null);
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
    setVendedor('LUENGAS ACOSTA DANIEL ARTURO');
    setDiasCredito(30);
    setEmail('');
    setAutorizaEmail(true);
    setEsCliente(true);
    setEsProveedor(false);
    setEsEmpleado(false);
    setEsSocio(false);
    setEsVendedor(false);
    setOtros(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (party: ThirdParty) => {
    setEditingParty(party);
    setTipoPersona(party.tipo_persona);
    setTipoId(party.tipo_id);
    setIdentificacion(party.identificacion);
    setDv(party.dv);
    setRazonSocial(party.razon_social);
    setPrimerApellido(party.primer_apellido || '');
    setSegundoApellido(party.segundo_apellido || '');
    setPrimerNombre(party.primer_nombre || '');
    setSegundoNombre(party.segundo_nombre || '');
    setFechaRegistro(party.fecha_registro);
    setDireccion(party.direccion);
    setTelefono(party.telefono);
    setPais(party.pais);
    setCiudad(party.ciudad);
    setCorreoFe(party.correo_fe);
    setNombreSucursal(party.nombre_sucursal || 'PRINCIPAL');
    setVendedor(party.vendedor || '');
    setDiasCredito(party.dias_credito || 0);
    setEmail(party.email);
    setAutorizaEmail(party.autoriza_email);
    setEsCliente(party.es_cliente);
    setEsProveedor(party.es_proveedor);
    setEsEmpleado(party.es_empleado);
    setEsSocio(party.es_socio);
    setEsVendedor(party.es_vendedor);
    setOtros(party.otros);
    setShowModal(true);
  };

  const handleSaveThirdParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificacion.trim()) {
      setFeedbackMsg({ type: 'error', text: 'La identificación es obligatoria.' });
      return;
    }

    const calculatedName = tipoPersona === 'juridica'
      ? razonSocial.trim()
      : `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`.replace(/\s+/g, ' ').trim();

    if (!calculatedName) {
      setFeedbackMsg({ type: 'error', text: 'El nombre o razón social es obligatorio.' });
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);

    try {
      await PractikoThirdPartyService.saveThirdParty({
        id: editingParty?.id,
        tipo_persona: tipoPersona,
        tipo_id: tipoId,
        identificacion: identificacion.trim(),
        dv: dv.trim() || calculateDianDv(identificacion),
        razon_social: calculatedName,
        primer_apellido: primerApellido.trim() || null,
        segundo_apellido: segundoApellido.trim() || null,
        primer_nombre: primerNombre.trim() || null,
        segundo_nombre: segundoNombre.trim() || null,
        fecha_registro: fechaRegistro,
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        pais: pais.trim(),
        ciudad: ciudad.trim(),
        correo_fe: correoFe.trim(),
        nombre_sucursal: nombreSucursal.trim(),
        vendedor: vendedor.trim(),
        dias_credito: Number(diasCredito) || 0,
        email: email.trim(),
        autoriza_email: autorizaEmail,
        es_cliente: esCliente,
        es_proveedor: esProveedor,
        es_empleado: esEmpleado,
        es_socio: esSocio,
        es_vendedor: esVendedor,
        otros: otros,
      });

      setShowModal(false);
      await loadParties();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error al guardar tercero' });
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
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Directorio de Terceros</h1>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
              ESTÁNDAR PRACTIKO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro unificado de clientes, proveedores y colaboradores con validación DIAN y facturación electrónica.
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="erp-btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Crear Tercero</span>
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabFilter === 'all'
                ? 'bg-brand-orange text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Todos ({parties.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('clientes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabFilter === 'clientes'
                ? 'bg-brand-orange text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Clientes
          </button>
          <button
            onClick={() => setActiveTabFilter('proveedores')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTabFilter === 'proveedores'
                ? 'bg-brand-orange text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Proveedores
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por NIT, razón social o ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="erp-input pl-9"
          />
        </div>
      </div>

      {/* TABLA DE TERCEROS */}
      <div className="erp-card p-0 overflow-hidden">
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="erp-th">Identificación / NIT</th>
                <th className="erp-th">Razón Social / Nombre</th>
                <th className="erp-th">Contacto & Ubicación</th>
                <th className="erp-th">Correo Facturación (FE)</th>
                <th className="erp-th">Vendedor</th>
                <th className="erp-th">Crédito</th>
                <th className="erp-th">Tipo</th>
                <th className="erp-th text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Cargando directorio de terceros...
                  </td>
                </tr>
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    No se encontraron terceros registrados con ese criterio.
                  </td>
                </tr>
              ) : (
                filteredParties.map((party) => (
                  <tr key={party.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="erp-td font-mono font-bold text-white">
                      {formatColombianNit(party.identificacion, party.dv)}
                      <span className="ml-1 text-[10px] text-slate-400 font-sans">({party.tipo_id})</span>
                    </td>
                    <td className="erp-td font-semibold text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                        <span>{party.razon_social}</span>
                      </div>
                    </td>
                    <td className="erp-td">
                      <div className="text-[11px] text-slate-300">{party.ciudad}, {party.pais}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {party.telefono || '--'}
                      </div>
                    </td>
                    <td className="erp-td font-mono text-[11px] text-slate-300">
                      {party.correo_fe || party.email || '--'}
                    </td>
                    <td className="erp-td text-[11px] text-slate-300">
                      {party.vendedor || '--'}
                    </td>
                    <td className="erp-td">
                      {party.dias_credito > 0 ? (
                        <span className="erp-badge-emerald">{party.dias_credito} días</span>
                      ) : (
                        <span className="erp-badge-slate">Contado</span>
                      )}
                    </td>
                    <td className="erp-td">
                      <div className="flex flex-wrap gap-1">
                        {party.es_cliente && <span className="erp-badge-orange">Cliente</span>}
                        {party.es_proveedor && <span className="erp-badge-blue">Proveedor</span>}
                      </div>
                    </td>
                    <td className="erp-td text-right">
                      <button
                        onClick={() => handleOpenEditModal(party)}
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

      {/* MODAL CREAR / EDITAR TERCERO (DISEÑO FIEL A PRACTIKO) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Building2 className="w-5 h-5 text-brand-orange" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                {editingParty ? 'Editar Tercero — Practiko' : 'Crear Tercero — Estándar Practiko'}
              </h2>
            </div>

            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-semibold ${
                  feedbackMsg.type === 'error'
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveThirdParty} className="space-y-5">
              {/* SECCIÓN 1: DATOS BÁSICOS & IDENTIFICACIÓN */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-brand-orange" /> Identificación y Tipo de Persona
                  </span>

                  {/* Switch Jurídica / Natural */}
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="tipoPersona"
                        value="juridica"
                        checked={tipoPersona === 'juridica'}
                        onChange={() => setTipoPersona('juridica')}
                        className="text-brand-orange focus:ring-brand-orange"
                      />
                      <span className="font-semibold">Jurídica</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="tipoPersona"
                        value="natural"
                        checked={tipoPersona === 'natural'}
                        onChange={() => setTipoPersona('natural')}
                        className="text-brand-orange focus:ring-brand-orange"
                      />
                      <span className="font-semibold">Natural</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <label className="erp-label">Tipo de Id</label>
                    <select
                      value={tipoId}
                      onChange={(e) => setTipoId(e.target.value as TipoId)}
                      className="erp-select"
                    >
                      <option value="NIT">NIT</option>
                      <option value="CC">Cédula de Ciudadanía (CC)</option>
                      <option value="CE">Cédula de Extranjería (CE)</option>
                      <option value="PA">Pasaporte (PA)</option>
                      <option value="TI">Tarjeta de Identidad (TI)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="erp-label">Identificación / Número</label>
                    <input
                      type="text"
                      placeholder="Ej: 830090754"
                      value={identificacion}
                      onChange={(e) => handleIdentificacionChange(e.target.value)}
                      required
                      className="erp-input font-mono"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="erp-label" title="Dígito de Verificación DIAN">DV</label>
                    <input
                      type="text"
                      maxLength={1}
                      placeholder="DV"
                      value={dv}
                      onChange={(e) => setDv(e.target.value)}
                      className="erp-input text-center font-mono font-bold"
                    />
                  </div>

                  {tipoPersona === 'juridica' ? (
                    <div className="sm:col-span-4">
                      <label className="erp-label">Razón Social</label>
                      <input
                        type="text"
                        placeholder="Ej: ALBAUGH COLOMBIA S.A.S."
                        value={razonSocial}
                        onChange={(e) => setRazonSocial(e.target.value)}
                        required
                        className="erp-input uppercase"
                      />
                    </div>
                  ) : (
                    <div className="sm:col-span-4">
                      <label className="erp-label">Fecha de Registro</label>
                      <input
                        type="date"
                        value={fechaRegistro}
                        onChange={(e) => setFechaRegistro(e.target.value)}
                        className="erp-input"
                      />
                    </div>
                  )}
                </div>

                {tipoPersona === 'natural' && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="erp-label">Primer Apellido</label>
                      <input
                        type="text"
                        value={primerApellido}
                        onChange={(e) => setPrimerApellido(e.target.value)}
                        className="erp-input uppercase"
                      />
                    </div>
                    <div>
                      <label className="erp-label">Segundo Apellido</label>
                      <input
                        type="text"
                        value={segundoApellido}
                        onChange={(e) => setSegundoApellido(e.target.value)}
                        className="erp-input uppercase"
                      />
                    </div>
                    <div>
                      <label className="erp-label">Primer Nombre</label>
                      <input
                        type="text"
                        value={primerNombre}
                        onChange={(e) => setPrimerNombre(e.target.value)}
                        className="erp-input uppercase"
                      />
                    </div>
                    <div>
                      <label className="erp-label">Segundo Nombre</label>
                      <input
                        type="text"
                        value={segundoNombre}
                        onChange={(e) => setSegundoNombre(e.target.value)}
                        className="erp-input uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: UBICACIÓN Y CONTACTO */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
                  <MapPin className="w-4 h-4 text-brand-orange" /> Ubicación y Datos de Contacto
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="erp-label">Dirección</label>
                    <input
                      type="text"
                      placeholder="CARRERA 22 NO. 98-82 OF 703"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="erp-input uppercase"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="erp-label">Teléfono</label>
                    <input
                      type="text"
                      placeholder="573192156833"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="erp-input font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="erp-label">Ciudad</label>
                    <input
                      type="text"
                      placeholder="Bogotá D.C."
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      className="erp-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="erp-label">Correo FE (Facturación Electrónica DIAN)</label>
                    <input
                      type="email"
                      placeholder="facturacion@empresa.com"
                      value={correoFe}
                      onChange={(e) => setCorreoFe(e.target.value)}
                      className="erp-input"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="erp-label">País</label>
                    <input
                      type="text"
                      value={pais}
                      onChange={(e) => setPais(e.target.value)}
                      className="erp-input"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="erp-label">Nombre Sucursal</label>
                    <input
                      type="text"
                      value={nombreSucursal}
                      onChange={(e) => setNombreSucursal(e.target.value)}
                      className="erp-input uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: DATOS ADICIONALES (VENDEDOR, CRÉDITO, EMAIL) */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
                  <Briefcase className="w-4 h-4 text-brand-orange" /> Datos Comerciales
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <label className="erp-label">Vendedor Comercial Asignado</label>
                    <input
                      type="text"
                      placeholder="Nombre del asesor comercial"
                      value={vendedor}
                      onChange={(e) => setVendedor(e.target.value)}
                      className="erp-input uppercase"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="erp-label">Días de Crédito</label>
                    <input
                      type="number"
                      min={0}
                      value={diasCredito}
                      onChange={(e) => setDiasCredito(parseInt(e.target.value, 10) || 0)}
                      className="erp-input font-mono"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="erp-label">Email de Notificaciones</label>
                    <input
                      type="email"
                      placeholder="contacto@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="erp-input"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autorizaEmail}
                      onChange={(e) => setAutorizaEmail(e.target.checked)}
                      className="rounded border-slate-700 text-brand-orange focus:ring-brand-orange"
                    />
                    <span>Autorizar envío de cotizaciones e instrucciones por e-mail</span>
                  </label>
                </div>
              </div>

              {/* SECCIÓN 4: TIPO DE TERCERO */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700/60 pb-2">
                  <Users className="w-4 h-4 text-brand-orange" /> Tipo de Tercero
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esCliente}
                      onChange={(e) => setEsCliente(e.target.checked)}
                      className="rounded text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-slate-300">Cliente</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esProveedor}
                      onChange={(e) => setEsProveedor(e.target.checked)}
                      className="rounded text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-slate-300">Proveedor</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esEmpleado}
                      onChange={(e) => setEsEmpleado(e.target.checked)}
                      className="rounded text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-slate-300">Empleado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esVendedor}
                      onChange={(e) => setEsVendedor(e.target.checked)}
                      className="rounded text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-slate-300">Vendedor</span>
                  </label>
                </div>
              </div>

              {/* ACCIONES DEL FORMULARIO */}
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
                  <span>{saving ? 'Guardando...' : 'Guardar Tercero'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
