import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Plus,
  Search,
  Users,
  Package,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Company } from '../types/shipment';
import { getShipmentStatusLabel } from '../types/shipment';
import { ThirdPartyService } from '../services/commercialService';
import type { ThirdParty } from '../types/commercial';
import { MarqueeText } from '../components/common/MarqueeText';
import { PreviewPill } from '../components/common/PreviewPill';

interface CompanyWithStats extends Company {
  shipmentCount: number;
  userCount: number;
  shipmentsList?: Array<{
    id: string;
    do_number: string;
    current_status?: string | null;
    origin?: string | null;
    destination?: string | null;
    carrier?: string | null;
    shipment_type?: string | null;
  }>;
  usersList?: Array<{
    id: string;
    email: string;
    nickname?: string | null;
    is_internal: boolean;
    status?: string | null;
  }>;
}

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Modal crear empresa
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedThirdPartyId, setSelectedThirdPartyId] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data: compData, error: compErr } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (compErr) throw compErr;

      let csData: any[] = [];
      try {
        const { data, error } = await supabase
          .from('company_shipment')
          .select('company_id, shipment_id, shipments(id, do_number, current_status, origin, destination, carrier, shipment_type)');
        if (!error && data) {
          csData = data;
        } else {
          const { data: fallback } = await supabase.from('company_shipment').select('company_id, shipment_id');
          csData = fallback || [];
        }
      } catch (err) {
        console.warn('Fallback loading company_shipment:', err);
      }

      const { data: profData } = await supabase
        .from('profiles')
        .select('email, nickname, is_internal, status, company_id')
        .eq('is_internal', false);

      const shipmentsMap: Record<string, any[]> = {};
      (csData || []).forEach((item: any) => {
        if (item.company_id) {
          if (!shipmentsMap[item.company_id]) shipmentsMap[item.company_id] = [];
          if (item.shipments) {
            shipmentsMap[item.company_id].push(item.shipments);
          } else if (item.shipment_id) {
            shipmentsMap[item.company_id].push({ id: item.shipment_id, do_number: 'Carga vinculada' });
          }
        }
      });

      const userMap: Record<string, any[]> = {};
      (profData || []).forEach((item: any) => {
        if (item.company_id) {
          if (!userMap[item.company_id]) userMap[item.company_id] = [];
          userMap[item.company_id].push(item);
        }
      });

      const enriched = (compData || []).map((c: Company) => {
        const cShipments = shipmentsMap[c.id] || [];
        const cUsers = userMap[c.id] || [];
        return {
          ...c,
          shipmentCount: cShipments.length,
          userCount: cUsers.length,
          shipmentsList: cShipments,
          usersList: cUsers,
        };
      });

      setCompanies(enriched);

      const parties = await ThirdPartyService.getThirdParties();
      setThirdParties(parties.filter((p) => p.es_cliente));
    } catch (err) {
      console.error('Error fetching companies in ERP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSavingCompany(true);
    setModalError(null);

    try {
      const { error } = await supabase.from('companies').insert({
        name: newName.trim().toUpperCase(),
      });

      if (error) throw error;

      setShowCreateModal(false);
      setNewName('');
      setSelectedThirdPartyId('');
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
    return c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="erp-page-title">Empresas del Portal de Seguimiento</h1>
          <p className="erp-page-subtitle">
            Cuentas cliente vinculadas al portal de seguimiento de cargas.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            onClick={fetchCompanies}
            className="erp-btn-secondary"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refrescar</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="erp-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Empresa</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="erp-filter-bar max-w-md">
        <div className="relative w-full">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-disabled)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar empresa por nombre, NIT o correo..."
            className="erp-search-input"
          />
        </div>
      </div>

      {/* Grid of Companies */}
      {loading ? (
        <div className="py-20 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand-orange)' }} />
          <span>Cargando empresas...</span>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div
          className="py-16 text-center text-xs rounded-2xl p-6"
          style={{
            backgroundColor: 'var(--surface-base)',
            border: '1px dashed var(--border-default)',
            color: 'var(--text-muted)',
          }}
        >
          No se encontraron empresas registradas con el criterio de búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((comp) => (
            <div
              key={comp.id}
              className="erp-card erp-card-interactive flex flex-col justify-between relative hover:z-20"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                    style={{
                      backgroundColor: 'var(--brand-orange-dim)',
                      color: 'var(--brand-orange-text)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs shrink-0">
                    <PreviewPill
                      label={`${comp.shipmentCount} ${comp.shipmentCount === 1 ? 'Carga' : 'Cargas'}`}
                      icon={Package}
                      variant="blue"
                      title={`Cargas de ${comp.name}`}
                      subtitle={`${comp.shipmentCount} ${comp.shipmentCount === 1 ? 'carga registrada' : 'cargas registradas'}`}
                      modalTitle={`Cargas Registradas — ${comp.name}`}
                      emptyMessage="Esta empresa no tiene cargas vinculadas en el portal."
                      items={(comp.shipmentsList || []).map((s) => ({
                        id: s.id,
                        title: s.do_number || 'Sin DO',
                        subtitle: s.origin && s.destination ? `${s.origin} → ${s.destination}` : (s.carrier || undefined),
                        badge: s.current_status
                          ? {
                              text: getShipmentStatusLabel(s.current_status),
                              variant: s.current_status === 'arrived' ? 'emerald' : s.current_status === 'in_transit' ? 'blue' : 'slate',
                            }
                          : undefined,
                        icon: Package,
                        onClick: () => navigate(`/shipments/${s.id}`),
                      }))}
                    />

                    <PreviewPill
                      label={`${comp.userCount} ${comp.userCount === 1 ? 'Usuario' : 'Usuarios'}`}
                      icon={Users}
                      variant="emerald"
                      title={`Usuarios de ${comp.name}`}
                      subtitle={`${comp.userCount} ${comp.userCount === 1 ? 'usuario vinculado' : 'usuarios vinculados'}`}
                      modalTitle={`Usuarios Vinculados — ${comp.name}`}
                      emptyMessage="Esta empresa no tiene usuarios registrados en el portal."
                      items={(comp.usersList || []).map((u) => ({
                        id: u.id || u.email,
                        title: u.email,
                        subtitle: u.nickname ? `Nickname: ${u.nickname}` : undefined,
                        meta: u.status === 'inactive' ? 'Estado: Inactivo' : 'Estado: Activo',
                        badge: {
                          text: u.is_internal ? 'Operador' : 'Cliente',
                          variant: u.is_internal ? 'orange' : 'blue',
                        },
                        icon: Users,
                        onClick: () => navigate(`/users?search=${encodeURIComponent(u.email)}`),
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <MarqueeText
                    text={comp.name}
                    containerClassName="max-w-full"
                    className="text-sm sm:text-base font-bold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="erp-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="erp-modal w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* Pinned Header */}
            <div className="erp-modal-header">
              <h3 className="erp-page-title text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 shrink-0" style={{ color: 'var(--brand-orange)' }} />
                Registrar Empresa en Portal
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="erp-icon-btn"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="erp-modal-body space-y-3.5">
                {modalError && (
                  <div className="erp-badge-danger w-full p-3 rounded-xl justify-start text-xs">
                    {modalError}
                  </div>
                )}

                {thirdParties.length > 0 && (
                  <div className="erp-card-subtle space-y-1.5">
                    <label className="erp-label">Importar desde Tercero Comercial</label>
                    <select
                      value={selectedThirdPartyId}
                      onChange={(e) => {
                        setSelectedThirdPartyId(e.target.value);
                        const found = thirdParties.find((p) => p.id === e.target.value);
                        if (found) setNewName(found.razon_social);
                      }}
                      className="erp-select text-xs"
                    >
                      <option value="">-- Seleccionar tercero existente --</option>
                      {thirdParties.map((tp) => (
                        <option key={tp.id} value={tp.id}>
                          {tp.razon_social} (NIT: {tp.identificacion})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="erp-label">
                    Razón Social / Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: LOCERIA COLOMBIANA SAS"
                    className="erp-input uppercase font-semibold"
                  />
                </div>

                <div className="p-3 rounded-xl text-xs space-y-1" style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Portal de Seguimiento
                  </div>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Esta entidad permite asociar cargas y autorizar a los clientes para acceder a <strong>como-va-mi-carga.ingelox.com.co</strong>.
                  </p>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="erp-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="erp-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="erp-btn-primary"
                >
                  {savingCompany ? 'Guardando...' : 'Crear Empresa'}
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
