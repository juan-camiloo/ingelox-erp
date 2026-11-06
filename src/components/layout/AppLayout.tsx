import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass, PlusCircle, Building2, Users, LogOut,
  ChevronLeft, ChevronRight, Shield, Search,
  ExternalLink, PackageCheck, FileText, FileSpreadsheet,
  Receipt, Sun, Moon, Menu, X, Plane,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { STRINGS } from '../../constants/strings'
export const AppLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = globalSearch.trim();
    if (!query) return;

    const base = location.pathname.split('/')[1] || 'operations';
    const searchableModules = ['operations', 'quotations', 'instructions', 'awb', 'third-parties', 'billing-concepts', 'clients', 'users'];
    const targetModule = searchableModules.includes(base) ? base : 'operations';
    navigate(`/${targetModule}?search=${encodeURIComponent(query)}`);
  };

  const navItems = [
     { to: '/operations',       label: STRINGS.navigation.trafficControl,    subtitle: STRINGS.navigation.trafficControlSub,    icon: Compass },
    { to: '/quotations',       label: STRINGS.navigation.quotations,        subtitle: STRINGS.navigation.quotationsSub,        icon: FileText },
    { to: '/instructions',     label: STRINGS.navigation.instructions,      subtitle: STRINGS.navigation.instructionsSub,      icon: FileSpreadsheet },
    { to: '/awb',              label: STRINGS.navigation.awb,               subtitle: STRINGS.navigation.awbSub,               icon: Plane },
    { to: '/third-parties',    label: STRINGS.navigation.thirdParties,      subtitle: STRINGS.navigation.thirdPartiesSub,      icon: Users },
    { to: '/billing-concepts', label: STRINGS.navigation.concepts,          subtitle: STRINGS.navigation.conceptsSub,          icon: Receipt },
    { to: '/clients',          label: STRINGS.navigation.trackingCompanies, subtitle: STRINGS.navigation.trackingCompaniesSub, icon: Building2 },
    { to: '/users',            label: STRINGS.navigation.users,             subtitle: STRINGS.navigation.usersSub,             icon: Shield },
  ];

  const initials = (profile?.nickname || profile?.email || 'OP').substring(0, 2).toUpperCase();

  const renderNavContent = (isMobileView = false) => (
    <>
      {/* Brand header */}
      <div
        className="h-16 flex items-center justify-between gap-3 shrink-0 px-4"
        style={{
          backgroundColor: 'var(--sidebar-bg-deeper)',
          borderBottom: '1px solid var(--sidebar-border)',
        }}
      >
        <Link
          to="/operations"
          className="flex items-center gap-3 group cursor-pointer transition-transform hover:scale-[1.02]"
          title="Ir al inicio de operaciones"
        >
          {/* Logo mark */}
          <div className="shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F35815] to-orange-700 flex items-center justify-center shadow-lg transition-shadow group-hover:shadow-orange-500/40"
                 style={{ boxShadow: '0 4px 12px rgba(243,88,21,0.4)' }}>
              <PackageCheck className="w-5 h-5 text-white" />
            </div>
          </div>
          {(!collapsed || isMobileView) && (
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white group-hover:text-orange-400 transition-colors">INGELOX</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ backgroundColor: 'rgba(243,88,21,0.25)', color: '#ff9f6b', border: '1px solid rgba(243,88,21,0.35)' }}>
                  ERP
                </span>
              </div>
              <span className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--nav-text)' }}>
                Torre de Control Operativo
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {isMobileView && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/operations' && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed && !isMobileView ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl transition-all duration-150 group
                ${collapsed && !isMobileView ? 'px-0 py-3 justify-center' : 'px-3 py-2.5'}`}
              style={isActive
                ? {
                    backgroundColor: 'var(--nav-active-bg)',
                    boxShadow: `0 2px 8px var(--nav-active-shadow)`,
                    color: 'var(--nav-text-active)',
                  }
                : { color: 'var(--nav-text)' }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = 'var(--nav-hover-bg)';
                  el.style.color = 'var(--nav-text-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = 'transparent';
                  el.style.color = 'var(--nav-text)';
                }
              }}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {(!collapsed || isMobileView) && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-semibold leading-tight truncate">
                    {item.label}
                  </span>
                  <span className="text-[10px] truncate mt-0.5"
                        style={{ color: isActive ? 'var(--nav-subtitle-active)' : 'var(--nav-subtitle)' }}>
                    {item.subtitle}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Divider + Portal link */}
      <div className="px-2 pb-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="pt-2">
          <a
            href="https://como-va-mi-carga.ingelox.com.co"
            target="_blank"
            rel="noopener noreferrer"
            title="Portal de Clientes"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium transition-all
              ${collapsed && !isMobileView ? 'justify-center px-0' : ''}`}
            style={{ color: 'var(--nav-text)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nav-hover-bg)';
              (e.currentTarget as HTMLElement).style.color = 'var(--nav-text-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--nav-text)';
            }}
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            {(!collapsed || isMobileView) && <span className="truncate">Portal Clientes</span>}
          </a>
        </div>
      </div>

      {/* User card */}
      <div className="p-2 shrink-0" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className={`flex items-center gap-2.5 px-2 py-2 rounded-xl ${collapsed && !isMobileView ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold text-white"
               style={{ backgroundColor: 'var(--nav-active-bg)', boxShadow: '0 2px 6px var(--nav-active-shadow)' }}>
            {initials}
          </div>

          {(!collapsed || isMobileView) && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-white truncate">
                  {profile?.nickname || profile?.email?.split('@')[0]}
                </div>
                <div className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: '#4ade80' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Conectado
                </div>
              </div>
              <button
                onClick={() => signOut()}
                title="Cerrar sesión"
                className="p-1.5 rounded-lg transition-colors shrink-0"
                style={{ color: 'var(--nav-text)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#fb7185';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(251,113,133,0.12)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--nav-text)';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans" style={{ backgroundColor: 'var(--surface-bg)' }}>

      {/* ══════════════════════════════════════
          MOBILE DRAWER BACKDROP & SIDEBAR (< md)
      ══════════════════════════════════════ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col md:hidden transition-transform duration-300 ease-in-out shadow-2xl
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
      >
        {renderNavContent(true)}
      </aside>

      {/* ══════════════════════════════════════
          DESKTOP SIDEBAR (md+) — navy oscuro siempre
      ══════════════════════════════════════ */}
      <aside
        className={`hidden md:flex relative flex-col z-20 transition-all duration-300 shrink-0 ${collapsed ? 'w-[72px]' : 'w-60'}`}
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
      >
        {renderNavContent(false)}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-[72px] z-30 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            backgroundColor: 'var(--surface-base)',
            border: '1.5px solid var(--border-default)',
            color: 'var(--text-muted)',
            boxShadow: 'var(--shadow-card)',
          }}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* ══════════════════════════════════════
          MAIN AREA (Header + Content)
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TOP BAR */}
        <header
          className="h-14 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 shrink-0"
          style={{
            backgroundColor: 'var(--topbar-bg)',
            boxShadow: 'var(--topbar-shadow)',
            borderBottom: '1px solid var(--topbar-border)',
          }}
        >
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl md:hidden transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search bar */}
          <form onSubmit={handleGlobalSearch} className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-disabled)' }} />
              <input
                type="text"
                placeholder="Buscar en el módulo activo..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="erp-search-input text-xs"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="erp-icon-btn p-2"
              aria-label="Cambiar tema"
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4" style={{ color: 'var(--brand-navy)' }} />
              }
            </button>

            {/* Separator */}
            <div className="w-px h-5 mx-0.5 sm:mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

            {/* Nueva carga button */}
            <button
              onClick={() => navigate('/shipments/new')}
              className="erp-btn-primary px-3 sm:px-4 py-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Carga</span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT — Mobile-first padding */}
        <main
          className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6"
          style={{ backgroundColor: 'var(--surface-bg)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
