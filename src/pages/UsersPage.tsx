import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  Building,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile, Company } from '../types/shipment';
import { useAuth } from '../context/AuthContext';
import { PreviewPill } from '../components/common/PreviewPill';

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile: currentProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
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
        .select('id, email, nickname, is_internal, company_id, status')
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

  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

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
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="erp-page-title">
            Directorio de Usuarios y Operadores
          </h1>
          <p className="erp-page-subtitle">
            Control de cuentas internas, operadores y usuarios clientes asignados
          </p>
        </div>

        <button
          onClick={fetchUsersAndCompanies}
          className="erp-btn-secondary self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refrescar</span>
        </button>
      </div>

      {errorMsg && (
        <div className="erp-badge-danger w-full p-3.5 rounded-xl justify-start text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="erp-filter-bar">
        <div className="relative w-full sm:w-80">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-disabled)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por correo, nickname o empresa..."
            className="erp-search-input"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'all'
                ? 'erp-btn-primary'
                : 'erp-btn-ghost'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('internal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'internal'
                ? 'erp-badge-orange'
                : 'erp-btn-ghost'
            }`}
          >
            Operadores ({users.filter((u) => u.is_internal).length})
          </button>
          <button
            onClick={() => setRoleFilter('client')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              roleFilter === 'client'
                ? 'erp-badge-blue'
                : 'erp-btn-ghost'
            }`}
          >
            Clientes ({users.filter((u) => !u.is_internal).length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="erp-table-container">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="erp-th">Usuario</th>
                <th className="erp-th">Nickname Operativo</th>
                <th className="erp-th">Tipo / Rol</th>
                <th className="erp-th">Empresa Asignada</th>
                <th className="erp-th">Estado</th>
                <th className="erp-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--brand-orange)' }} />
                      <span>Cargando usuarios...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentProfile?.id;
                  const isEditingThis = editingUserId === user.id;

                  return (
                    <tr key={user.id} className="erp-tr">
                      {/* Correo / Usuario */}
                      <td className="erp-td">
                        <div className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                          <span>{user.email}</span>
                          {isCurrent && (
                            <span className="erp-badge-slate text-[9px] px-1.5 py-0.5">
                              Tú
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Nickname (editable) */}
                      <td className="erp-td">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={nicknameDraft}
                              onChange={(e) => setNicknameDraft(e.target.value)}
                              placeholder="Escribe nickname..."
                              className="erp-input py-1 px-2.5 max-w-[160px]"
                            />
                            <button
                              onClick={() => handleSaveNickname(user.id)}
                              disabled={savingNickname}
                              className="erp-action-btn erp-action-btn-excel"
                              title="Guardar nickname"
                              aria-label="Guardar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="erp-action-btn erp-action-btn-delete"
                              title="Cancelar"
                              aria-label="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: user.nickname ? 'var(--text-primary)' : 'var(--text-disabled)' }}>
                              {user.nickname || <em>Sin nickname</em>}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Tipo / Rol */}
                      <td className="erp-td">
                        {user.is_internal ? (
                          <span className="erp-badge-orange">
                            <Shield className="w-3 h-3" /> Operador Interno
                          </span>
                        ) : (
                          <span className="erp-badge-blue">
                            <UserCheck className="w-3 h-3" /> Cliente Externo
                          </span>
                        )}
                      </td>

                      {/* Empresa */}
                      <td className="erp-td">
                        {user.company_id && companies[user.company_id] ? (
                          <PreviewPill
                            label={companies[user.company_id]}
                            icon={Building}
                            variant="slate"
                            title={`Miembros de ${companies[user.company_id]}`}
                            subtitle="Usuarios registrados con acceso a esta empresa"
                            modalTitle={`Miembros de ${companies[user.company_id]}`}
                            emptyMessage="No hay otros miembros registrados en esta empresa."
                            items={users
                              .filter((u) => u.company_id === user.company_id)
                              .map((u) => ({
                                id: u.id,
                                title: u.email,
                                subtitle: u.nickname ? `Nickname: ${u.nickname}` : undefined,
                                badge: {
                                  text: u.is_internal ? 'Operador' : 'Cliente',
                                  variant: u.is_internal ? 'orange' : 'blue',
                                },
                                icon: Users,
                                onClick: () => navigate(`/users?search=${encodeURIComponent(u.email)}`),
                              }))}
                          />
                        ) : (
                          <span style={{ color: 'var(--text-disabled)' }}>--</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="erp-td">
                        <span className={user.status === 'inactive' ? 'erp-badge-danger' : 'erp-badge-emerald'}>
                          {user.status === 'inactive' ? 'Inactivo' : 'Activo'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="erp-td text-right whitespace-nowrap">
                        <div className="erp-action-group">
                          {!isEditingThis ? (
                            <button
                              onClick={() => handleStartEdit(user)}
                              className="erp-action-btn erp-action-btn-edit"
                              title="Editar operador / nickname"
                              aria-label="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={handleCancelEdit}
                              className="erp-action-btn erp-action-btn-delete"
                              title="Cancelar edición"
                              aria-label="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
