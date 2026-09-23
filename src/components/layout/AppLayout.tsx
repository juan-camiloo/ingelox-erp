import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Building2,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Search,
  ExternalLink,
  PackageCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/operations?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const navItems = [
    {
      to: '/operations',
      label: 'Control de Tráfico',
      subtitle: 'Matriz activa de cargas',
      icon: Compass,
    },
    {
      to: '/shipments/new',
      label: 'Nueva Operación',
      subtitle: 'Registro ágil de DO',
      icon: PlusCircle,
    },
    {
      to: '/clients',
      label: 'Empresas y Clientes',
      subtitle: 'Directorio y asignaciones',
      icon: Building2,
    },
    {
      to: '/users',
      label: 'Equipo Interno',
      subtitle: 'Operadores y roles',
      icon: Users,
    },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside
        className={`flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 relative z-20 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-800 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-orange-600 flex items-center justify-center shadow-lg shadow-brand-orange/20 shrink-0">
            <PackageCheck className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                INGELOX <span className="text-xs px-1.5 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/30 font-semibold">ERP</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium truncate">Centro de Trabajo</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to !== '/operations' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {!collapsed && (
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="leading-tight">{item.label}</span>
                    <span className={`text-[10px] truncate ${isActive ? 'text-orange-100' : 'text-slate-400'}`}>
                      {item.subtitle}
                    </span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Portal de Clientes External Link */}
        <div className="px-3 pb-3">
          <a
            href="https://como-va-mi-carga.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            title="Ir al Portal de Clientes"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" />
            {!collapsed && <span className="truncate">Portal de Clientes</span>}
          </a>
        </div>

        {/* Bottom User Profile Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-brand-orange shrink-0">
              {(profile?.nickname || profile?.email || 'OP').substring(0, 2).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {profile?.nickname || profile?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <Shield className="w-2.5 h-2.5" /> Interno Ingelox
                </span>
              </div>
            )}
            <button
              onClick={() => signOut()}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-full p-1 shadow-md hover:bg-slate-700 transition-all z-30"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between gap-4 shrink-0">
          {/* Quick Search */}
          <form onSubmit={handleGlobalSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar DO, contenedor, guía, consignatario..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
              />
            </div>
          </form>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/shipments/new')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange hover:bg-orange-600 text-white text-xs font-semibold rounded-lg shadow-sm shadow-brand-orange/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nueva Carga</span>
            </button>
          </div>
        </header>

        {/* PAGE OUTLET */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
