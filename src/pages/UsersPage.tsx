import React, { useEffect, useState } from 'react';
import {
  Search,
  Shield,
  UserCheck,
  Edit2,
  Check,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  Building
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile, Company } from '../types/shipment';
import { useAuth } from '../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { profile: currentProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'internal' | 'client'>('all');

  // Inline editing of nickname
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsersAndCompanies = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Fetch companies to resolve company names
      const { data: compData } = await supabase.from('companies').select('id, name');
      const cMap: Record<string, string> = {};
      (compData || []).forEach((c: Company) => {
        cMap[c.id] = c.name;
      });
      setCompanies(cMap);

      // 2. Fetch profiles
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .order('is_internal', { ascending: false });

      if (profErr) throw profErr;
      setUsers((profData as UserProfile[]) || []);
    } catch (err: any) {
      console.error('Error fetching users in ERP:', err);
      setErrorMsg(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndCompanies();
  }, []);

  const handleStartEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setNicknameDraft(user.nickname || '');
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setNicknameDraft('');
  };

  const handleSaveNickname = async (userId: string) => {
    try {
      setSavingNickname(true);
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: nicknameDraft.trim() || null })
        .eq('id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, nickname: nicknameDraft.trim() || null } : u))
      );
      setEditingUserId(null);
    } catch (err: any) {
      console.error('Error updating nickname:', err);
      alert(err.message || 'Error al actualizar el nickname');
    } finally {
      setSavingNickname(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'internal' && !u.is_internal) return false;
    if (roleFilter === 'client' && u.is_internal) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchNick = u.nickname?.toLowerCase().includes(q);
      const companyName = u.company_id ? companies[u.company_id]?.toLowerCase() : '';
      const matchComp = companyName?.includes(q);
      return matchEmail || matchNick || matchComp;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Directorio de Usuarios y Operadores
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredUsers.length} de {users.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Control de cuentas internas, operadores y usuarios clientes asignados
          </p>
        </div>

        <button
          onClick={fetchUsersAndCompanies}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refrescar</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por correo, nickname o empresa..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              roleFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('internal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              roleFilter === 'internal'
                ? 'bg-orange-500/20 text-brand-orange border border-brand-orange/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Operadores ({users.filter((u) => u.is_internal).length})
          </button>
          <button
            onClick={() => setRoleFilter('client')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              roleFilter === 'client'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Clientes ({users.filter((u) => !u.is_internal).length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Nickname Operativo</th>
                <th className="py-3 px-4">Tipo / Rol</th>
                <th className="py-3 px-4">Empresa Asignada</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
                      <span>Cargando usuarios...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentProfile?.id;
                  const isEditingThis = editingUserId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Correo / Identificador */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span>{user.email}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.2 rounded">
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{user.id}</div>
                      </td>

                      {/* Nickname (editable) */}
                      <td className="py-3 px-4">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={nicknameDraft}
                              onChange={(e) => setNicknameDraft(e.target.value)}
                              placeholder="Escribe nickname..."
                              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-orange"
                            />
                            <button
                              onClick={() => handleSaveNickname(user.id)}
                              disabled={savingNickname}
                              className="p-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-200 font-medium">
                              {user.nickname || <span className="text-slate-500 italic">Sin nickname</span>}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Tipo / Rol */}
                      <td className="py-3 px-4">
                        {user.is_internal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-brand-orange border border-brand-orange/40">
                            <Shield className="w-3 h-3" /> Operador Interno
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            <UserCheck className="w-3 h-3" /> Cliente Externo
                          </span>
                        )}
                      </td>

                      {/* Empresa */}
                      <td className="py-3 px-4">
                        {user.company_id && companies[user.company_id] ? (
                          <span className="text-slate-300 font-medium flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {companies[user.company_id]}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">--</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            user.status === 'inactive'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {user.status === 'inactive' ? 'Inactivo' : 'Activo'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        {!isEditingThis && (
                          <button
                            onClick={() => handleStartEdit(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-brand-orange hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar Nickname</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
