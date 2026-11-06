import React, { useState, useRef, useEffect, useLayoutEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, X, Search, ExternalLink } from 'lucide-react';

export interface PreviewPillItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: {
    text: string;
    variant?: 'blue' | 'emerald' | 'orange' | 'danger' | 'slate';
  };
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
}

export interface PreviewPillProps {
  label: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'blue' | 'emerald' | 'orange' | 'slate' | 'danger';
  className?: string;
  title: string;
  subtitle?: string;
  items: PreviewPillItem[];
  emptyMessage?: string;
  maxPreviewCount?: number;
  modalTitle?: string;
}

interface PopoverPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

export const PreviewPill: React.FC<PreviewPillProps> = ({
  label,
  icon: Icon,
  variant = 'blue',
  className = '',
  title,
  subtitle,
  items = [],
  emptyMessage = 'No hay elementos registrados',
  maxPreviewCount = 4,
  modalTitle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [popoverPos, setPopoverPos] = useState<PopoverPosition | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalId = useId();

  const badgeClass =
    variant === 'blue'
      ? 'erp-badge-blue'
      : variant === 'emerald'
      ? 'erp-badge-emerald'
      : variant === 'orange'
      ? 'erp-badge-orange'
      : variant === 'danger'
      ? 'erp-badge-danger'
      : 'erp-badge-slate';

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const updatePlacement = useCallback(() => {
    if (!containerRef.current) return;

    const pillRect = containerRef.current.getBoundingClientRect();
    if (pillRect.width === 0 && pillRect.height === 0) return;

    // Detect main content area boundary (ensuring popovers never cross sidebar or window edges)
    const mainElem = containerRef.current.closest('main') || document.querySelector('main');
    const mainRect = mainElem ? mainElem.getBoundingClientRect() : null;

    const boundaryLeft = mainRect ? Math.max(0, mainRect.left) : 0;
    const boundaryRight = mainRect ? Math.min(window.innerWidth, mainRect.right) : window.innerWidth;
    const boundaryTop = mainRect ? Math.max(0, mainRect.top) : 0;
    const boundaryBottom = mainRect ? Math.min(window.innerHeight, mainRect.bottom) : window.innerHeight;

    const margin = 12;
    const maxAllowedWidth = Math.max(260, boundaryRight - boundaryLeft - margin * 2);
    const popoverWidth = Math.min(320, maxAllowedWidth);

    // Available space to the left inside content area (pill right edge -> boundaryLeft)
    const spaceOnLeft = pillRect.right - (boundaryLeft + margin);
    // Available space to the right inside content area (pill left edge -> boundaryRight)
    const spaceOnRight = (boundaryRight - margin) - pillRect.left;

    const canFitRight = spaceOnRight >= popoverWidth;
    const canFitLeft = spaceOnLeft >= popoverWidth;

    let candidateLeft: number;

    if (canFitRight && !canFitLeft) {
      // Must expand to the right
      candidateLeft = pillRect.left;
    } else if (!canFitRight && canFitLeft) {
      // Must expand to the left
      candidateLeft = pillRect.right - popoverWidth;
    } else if (canFitRight && canFitLeft) {
      // Both fit: choose the side with more available clearance
      candidateLeft = spaceOnRight >= spaceOnLeft ? pillRect.left : pillRect.right - popoverWidth;
    } else {
      // Tight viewport: pick side with greatest space
      candidateLeft = spaceOnRight >= spaceOnLeft ? pillRect.left : pillRect.right - popoverWidth;
    }

    // Safety clamp: strictly guarantee the popover stays within safe boundaries
    const safeLeft = Math.max(
      boundaryLeft + margin,
      Math.min(candidateLeft, boundaryRight - margin - popoverWidth)
    );

    // Vertical placement
    const spaceBelow = boundaryBottom - pillRect.bottom - 8;
    const spaceAbove = pillRect.top - boundaryTop - 8;

    let top: number | undefined;
    let bottom: number | undefined;
    let maxHeight: number;

    if (spaceBelow < 220 && spaceAbove > spaceBelow) {
      // Place above pill
      bottom = window.innerHeight - pillRect.top + 8;
      top = undefined;
      maxHeight = Math.max(180, Math.min(320, spaceAbove - 12));
    } else {
      // Place below pill
      top = pillRect.bottom + 8;
      bottom = undefined;
      maxHeight = Math.max(180, Math.min(320, spaceBelow - 12));
    }

    setPopoverPos({
      top,
      bottom,
      left: Math.round(safeLeft),
      width: Math.round(popoverWidth),
      maxHeight: Math.round(maxHeight),
    });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePlacement();

      const handleScrollOrResize = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        // Close if trigger element is scrolled completely out of view
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setIsOpen(false);
          return;
        }
        updatePlacement();
      };

      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen, updatePlacement]);

  const handleMouseEnter = () => {
    clearTimer();
    updatePlacement();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    clearTimer();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 75);
  };

  const handlePopoverMouseEnter = () => {
    clearTimer();
  };

  const handlePopoverMouseLeave = () => {
    clearTimer();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 75);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowModal(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // Focus search input when modal opens
  useEffect(() => {
    if (showModal) {
      setSearchTerm('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [showModal]);

  const handlePillClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (items.length > maxPreviewCount) {
      setShowModal(true);
      setIsOpen(false);
    } else {
      if (!isOpen) {
        updatePlacement();
      }
      setIsOpen((prev) => !prev);
    }
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setShowModal(true);
  };

  const previewItems = items.slice(0, maxPreviewCount);
  const remainingCount = items.length - maxPreviewCount;

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(term)) ||
      (item.meta && item.meta.toLowerCase().includes(term)) ||
      (item.badge && item.badge.text.toLowerCase().includes(term))
    );
  });

  const getItemBadgeClass = (itemVariant?: string) => {
    switch (itemVariant) {
      case 'emerald':
        return 'erp-badge-emerald';
      case 'orange':
        return 'erp-badge-orange';
      case 'danger':
        return 'erp-badge-danger';
      case 'slate':
        return 'erp-badge-slate';
      case 'blue':
      default:
        return 'erp-badge-blue';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Interactive Pill Trigger */}
      <button
        type="button"
        onClick={handlePillClick}
        aria-haspopup="dialog"
        aria-expanded={isOpen || showModal}
        className={`${badgeClass} cursor-pointer select-none whitespace-nowrap transition-all duration-150 active:scale-95 hover:brightness-110 shadow-sm ${className}`}
      >
        {Icon && <Icon className="w-3 h-3 shrink-0" />}
        <span>{label}</span>
      </button>

      {/* Floating Popover via Portal: completely immune to parent overflow/z-index/sidebar clipping */}
      {isOpen &&
        popoverPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
            className="rounded-2xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{
              position: 'fixed',
              top: popoverPos.top !== undefined ? `${popoverPos.top}px` : 'auto',
              bottom: popoverPos.bottom !== undefined ? `${popoverPos.bottom}px` : 'auto',
              left: `${popoverPos.left}px`,
              width: `${popoverPos.width}px`,
              maxHeight: `${popoverPos.maxHeight}px`,
              zIndex: 9999,
              backgroundColor: 'var(--surface-base)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-modal)',
              pointerEvents: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popover Header */}
            <div
              className="flex items-center justify-between pb-2 mb-2 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="min-w-0 pr-2">
                <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </div>
                {subtitle && (
                  <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {subtitle}
                  </div>
                )}
              </div>
              <span className={`${badgeClass} text-[9px] px-1.5 py-0.5 shrink-0`}>
                {items.length}
              </span>
            </div>

            {/* Items List */}
            {items.length === 0 ? (
              <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto erp-scrollbar pr-0.5">
                {previewItems.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                          setIsOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl transition-colors text-xs ${
                        item.onClick
                          ? 'cursor-pointer hover:bg-[var(--surface-raised)] active:scale-[0.98]'
                          : ''
                      }`}
                      style={{
                        backgroundColor: 'var(--surface-sunken)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {ItemIcon && (
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: 'var(--surface-raised)',
                              color: 'var(--brand-orange)',
                            }}
                          >
                            <ItemIcon className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div
                            className="font-semibold truncate text-xs"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                              {item.subtitle}
                            </div>
                          )}
                          {item.meta && (
                            <div
                              className="text-[9px] font-mono truncate"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {item.meta}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.badge && (
                          <span
                            className={`${getItemBadgeClass(
                              item.badge.variant
                            )} text-[9px] px-1.5 py-0.2 whitespace-nowrap`}
                          >
                            {item.badge.text}
                          </span>
                        )}
                        {item.onClick && (
                          <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer "Ver más" Button */}
            {remainingCount > 0 && (
              <div className="pt-2 mt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    color: 'var(--brand-orange-text)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <span>Ver todos ({items.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Complete Modal ("Ver más") via Portal */}
      {showModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalId}
            className="erp-modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <div
              className="erp-modal w-full max-w-lg max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="erp-modal-header">
                <div className="flex items-center gap-2 min-w-0">
                  {Icon && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: 'var(--brand-orange-dim)',
                        color: 'var(--brand-orange)',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h3 id={modalId} className="erp-page-title text-base truncate">
                      {modalTitle || title}
                    </h3>
                    {subtitle && <p className="erp-page-subtitle text-xs">{subtitle}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`${badgeClass} text-xs font-bold px-2 py-0.5`}>
                    {items.length} {items.length === 1 ? 'total' : 'totales'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="erp-icon-btn"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Search Bar */}
              {items.length > 4 && (
                <div
                  className="p-4 border-b"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--surface-sunken)',
                  }}
                >
                  <div className="relative">
                    <Search
                      className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-disabled)' }}
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filtrar por texto, estado o referencia..."
                      className="erp-search-input pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Modal Body */}
              <div className="erp-modal-body space-y-2 p-4 flex-1 overflow-y-auto erp-scrollbar">
                {filteredItems.length === 0 ? (
                  <div
                    className="py-12 text-center text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {searchTerm
                      ? 'No se encontraron resultados para la búsqueda.'
                      : emptyMessage}
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.onClick) {
                            item.onClick();
                            setShowModal(false);
                          }
                        }}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-all ${
                          item.onClick
                            ? 'cursor-pointer hover:bg-[var(--surface-raised)] hover:border-[var(--border-strong)] active:scale-[0.99]'
                            : ''
                        }`}
                        style={{
                          backgroundColor: 'var(--surface-base)',
                          border: '1px solid var(--border-default)',
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {ItemIcon && (
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: 'var(--surface-raised)',
                                color: 'var(--brand-orange)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <ItemIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div
                              className="font-bold text-sm truncate"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div
                                className="text-xs truncate"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {item.subtitle}
                              </div>
                            )}
                            {item.meta && (
                              <div
                                className="text-[11px] font-mono truncate"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {item.meta}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span
                              className={`${getItemBadgeClass(
                                item.badge.variant
                              )} text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap`}
                            >
                              {item.badge.text}
                            </span>
                          )}
                          {item.onClick && (
                            <button
                              type="button"
                              className="erp-action-btn erp-action-btn-view"
                              title="Ver detalles"
                              aria-label="Ver detalles"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="erp-modal-footer">
                <span
                  className="text-xs mr-auto hidden sm:inline"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Mostrando {filteredItems.length} de {items.length}{' '}
                  {items.length === 1 ? 'registro' : 'registros'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="erp-btn-secondary"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
