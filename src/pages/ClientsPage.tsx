import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Users,
  Package,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Company } from '../types/shipment';

interface CompanyWithStats extends Company {
  shipmentCount?: number;
  userCount?: number;
}

export const ClientsPage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal crear empresa
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNit, setNewNit] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      // 1. Fetch companies
      const { data: compData, error: compErr } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (compErr) throw compErr;

      // 2. Fetch assignments count
      const { data: csData } = await supabase
        .from('company_shipment')
        .select('company_id');

      // 3. Fetch client profiles count
      const { data: profData } = await supabase
        .from('profiles')
        .select('company_id');

      const shipmentMap: Record<string, number> = {};
      (csData || []).forEach((item: any) => {
        if (item.company_id) {
          shipmentMap[item.company_id] = (shipmentMap[item.company_id] || 0) + 1;
        }
      });

      const userMap: Record<string, number> = {};
      (profData || []).forEach((item: any) => {
        if (item.company_id) {
          userMap[item.company_id] = (userMap[item.company_id] || 0) + 1;
        }
      });

      const enriched = (compData || []).map((c: Company) => ({
        ...c,
        shipmentCount: shipmentMap[c.id] || 0,
        userCount: userMap[c.id] || 0,
      }));

      setCompanies(enriched);
    } catch (err) {
      console.error('Error fetching companies in ERP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSavingCompany(true);
    setModalError(null);

    try {
      const { error } = await supabase.from('companies').insert({
        name: newName.trim(),
        nit: newNit.trim() || null,
        email: newEmail.trim() || null,
        phone: newPhone.trim() || null,
        address: newAddress.trim() || null,
      });

      if (error) throw error;

      setShowCreateModal(false);
      setNewName('');
      setNewNit('');
      setNewEmail('');
      setNewPhone('');
      setNewAddress('');
      await fetchCompanies();
    } catch (err: any) {
      console.error('Error creating company:', err);
      setModalError(err.message || 'Error al registrar la empresa');
    } finally {
      setSavingCompany(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.nit && c.nit.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Directorio de Empresas y Clientes
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {companies.length} empresas
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Administración de cuentas comerciales y vinculación de expedientes de carga
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCompanies}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refrescar</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-md shadow-brand-orange/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Empresa</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar empresa por nombre, NIT o correo..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-orange"
        />
      </div>

      {/* Grid of Companies */}
      {loading ? (
        <div className="py-20 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-brand-orange" />
          <span>Cargando empresas...</span>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-2xl">
          No se encontraron empresas registradas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((comp) => (
            <div
              key={comp.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-brand-orange shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 text-slate-300">
                      <Package className="w-3.5 h-3.5 text-blue-400" />
                      {comp.shipmentCount} cargas
                    </span>
                    <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      {comp.userCount} usuarios
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{comp.name}</h3>
                <div className="text-[11px] font-mono text-slate-400 mb-3">
                  NIT: {comp.nit || 'Sin NIT registrado'}
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  {comp.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{comp.email}</span>
                    </div>
                  )}
                  {comp.phone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{comp.phone}</span>
                    </div>
                  )}
                  {comp.address && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{comp.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-orange" /> Registrar Nueva Empresa
            </h3>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Razón Social / Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: LOCERIA COLOMBIANA SAS"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  NIT o Identificación Tributaria
                </label>
                <input
                  type="text"
                  value={newNit}
                  onChange={(e) => setNewNit(e.target.value)}
                  placeholder="Ej: 890900123-4"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Correo de Contacto
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="comercial@empresa.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+57 300 0000000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Calle 10 # 40-20, Medellín"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="px-4 py-2 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-orange/20"
                >
                  {savingCompany ? 'Guardando...' : 'Crear Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
