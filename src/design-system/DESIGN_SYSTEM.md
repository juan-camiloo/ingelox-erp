# INGELOX ERP — Design System
**Versión:** 1.0.0 | **Fecha:** Octubre 2026 | **Estrategia:** Mobile-first

> ⚠️ **NORMA OBLIGATORIA:** Todo cambio visual en el proyecto —por mínimo que sea— debe fundamentarse EXCLUSIVAMENTE en este documento. Cualquier color, tamaño, espaciado o componente que no esté aquí definido NO debe implementarse hasta añadirlo primero a este sistema.

---

## Tabla de contenidos

1. [Principios de diseño](#1-principios-de-diseño)
2. [Paleta de colores](#2-paleta-de-colores)
3. [Tipografía](#3-tipografía)
4. [Espaciado y Layout](#4-espaciado-y-layout)
5. [Elevación y sombras](#5-elevación-y-sombras)
6. [Bordes y radio](#6-bordes-y-radio)
7. [Iconografía](#7-iconografía)
8. [Componentes](#8-componentes)
   - [Botones](#81-botones)
   - [Inputs y Formularios](#82-inputs-y-formularios)
   - [Cards](#83-cards)
   - [Tablas](#84-tablas)
   - [Badges y estados](#85-badges-y-estados)
   - [Modales](#86-modales)
   - [KPI Cards](#87-kpi-cards)
   - [Navigation](#88-navigation)
9. [Breakpoints — Mobile first](#9-breakpoints--mobile-first)
10. [Animaciones y transiciones](#10-animaciones-y-transiciones)
11. [Accesibilidad](#11-accesibilidad)

---

## 1. Principios de diseño

### Jerarquía visual
Los elementos más importantes deben captar la atención primero. Se aplica mediante:
- **Tamaño:** Títulos > Subtítulos > Cuerpo > Metadata
- **Peso:** Bold (700) > SemiBold (600) > Medium (500) > Regular (400)
- **Color:** `--text-primary` > `--text-secondary` > `--text-muted` > `--text-disabled`
- **Espacio:** Mayor espacio en blanco alrededor de elementos más importantes
- **Contraste:** Datos críticos tienen el mayor contraste posible

### Affordance (acción implícita)
Todo elemento interactivo debe indicar que puede interactuarse con él:
- Botones: `cursor-pointer`, sombra, cambio de color en hover
- Links: `hover:underline` o cambio de color
- Filas de tabla clickeables: `cursor-pointer`, cambio de fondo en hover
- Inputs: borde visible, focus ring naranja
- Items de menú: estado hover con fondo

### Feedback inmediato
- Loading: spinner animado en botones
- Error: mensaje en rojo con ícono
- Éxito: mensaje en verde con ícono
- Hover: cambio de color/fondo en ≤150ms
- Focus: ring visible de 3px

### Mobile-first
Siempre diseñar primero para mobile (≥375px) y escalar hacia arriba:
```
sin prefijo = mobile (≥0px)
sm:          = ≥640px  (tablet pequeña)
md:          = ≥768px  (tablet)
lg:          = ≥1024px (desktop)
xl:          = ≥1280px (desktop ancho)
```

---

## 2. Paleta de colores

### Fuente de verdad: CSS Custom Properties

Todos los colores del proyecto **deben** usarse como variables CSS, nunca como clases Tailwind hardcodeadas de color (`text-slate-*`, `bg-slate-*`, `text-white`, etc.).

```
❌ NUNCA: className="text-white bg-slate-900 border-slate-700"
✅ SIEMPRE: style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface-base)' }}
           O usar la clase utilitaria ERP correspondiente: className="erp-card erp-text"
```

### 2.1 Colores de Marca

| Token | Valor claro | Valor oscuro | Uso |
|-------|-------------|--------------|-----|
| `--brand-orange` | `#E84E0F` | `#F35815` | CTA principal, acciones primarias, enlaces activos |
| `--brand-orange-hover` | `#c33c08` | `#e04a0a` | Hover del botón primario |
| `--brand-orange-text` | `#b83a09` | `#F35815` | Texto naranja sobre fondos claros (garantiza 5.2:1) |
| `--brand-orange-dim` | `rgba(232,78,15,0.09)` | `rgba(243,88,21,0.14)` | Fondos de badges naranja, hover sutil |
| `--brand-orange-ring` | `rgba(232,78,15,0.28)` | `rgba(243,88,21,0.38)` | Focus ring en inputs |
| `--brand-navy` | `#14213d` | `#4d8fc4` | Sidebar, fondo login, acentos secundarios |

**Ingelox Brand Reference:**
- Naranja `#F35815` — color del texto "INGELOX" del logo
- Navy `#14213d` — color del engranaje del logo
- Estas dos combinaciones NO se mezclan directamente (naranja sobre navy = ✓, naranja sobre blanco = necesita ajuste a `#b83a09`)

### 2.2 Superficies (Fondos)

Sistema de 4 niveles de elevación:

```
 ┌─────────────────────────────────────────┐
 │  MODAL / OVERLAY  (--surface-overlay)   │  ← Mayor elevación
 │  ┌───────────────────────────────────┐  │
 │  │  CARD / PANEL  (--surface-base)   │  │
 │  │  ┌─────────────────────────────┐  │  │
 │  │  │ INPUT/CHIP (--surface-raised)│  │  │
 │  │  └─────────────────────────────┘  │  │
 │  └───────────────────────────────────┘  │
 │  PAGE BACKGROUND  (--surface-bg)        │  ← Menor elevación
 └─────────────────────────────────────────┘
```

| Token | Modo claro | Modo oscuro | Uso |
|-------|-----------|-------------|-----|
| `--surface-bg` | `#edf0f5` | `#090f1c` | Fondo de la página completa |
| `--surface-base` | `#ffffff` | `#111827` | Cards, paneles, topbar |
| `--surface-raised` | `#f4f6f9` | `#1a2539` | Inputs, chips, elementos anidados |
| `--surface-input` | `#ffffff` | `#1a2539` | Fondo específico de inputs |
| `--surface-hover` | `#edf0f5` | `rgba(255,255,255,0.04)` | Estado hover en filas/items |
| `--surface-overlay` | `#ffffff` | `#111827` | Modales y dropdowns |

### 2.3 Superficies del Sidebar (invariante en ambos modos)

El sidebar es **siempre oscuro** — conecta directamente con el navy del logo Ingelox.

| Token | Valor único | Uso |
|-------|-------------|-----|
| `--sidebar-bg` | `#14213d` | Fondo principal del sidebar |
| `--sidebar-bg-deeper` | `#0e1828` | Header del sidebar (brand mark) |
| `--sidebar-border` | `rgba(255,255,255,0.07)` | Separadores internos |

### 2.4 Bordes

| Token | Modo claro | Modo oscuro | Uso |
|-------|-----------|-------------|-----|
| `--border-default` | `#dde2ea` | `#1e2d47` | Borde principal de cards e inputs |
| `--border-strong` | `#b8c2d0` | `#2d4060` | Hover de bordes, énfasis |
| `--border-subtle` | `#edf0f5` | `rgba(255,255,255,0.05)` | Separadores de tabla, divisores sutiles |

### 2.5 Tipografía — Colores

4 niveles con contraste WCAG AA garantizado:

| Token | Modo claro | Ratio | Modo oscuro | Ratio | Uso |
|-------|-----------|-------|-------------|-------|-----|
| `--text-primary` | `#0d1b2e` | **16.5:1** | `#eaf0f8` | **13.2:1** | Títulos, datos críticos, valores KPI |
| `--text-secondary` | `#2d4060` | **8.1:1** | `#8ba5c0` | **5.2:1** | Body text, labels, navegación |
| `--text-muted` | `#5a7190` | **4.6:1** ✓ | `#4d6a85` | **4.5:1** ✓ | Metadata, captions, subtítulos |
| `--text-disabled` | `#9aafbf` | 2.8:1 | `#2d4060` | 3.0:1 | Placeholders, estados inactivos únicamente |

### 2.6 Estados semánticos

| Token | Modo claro | Modo oscuro | Uso |
|-------|-----------|-------------|-----|
| `--color-success` | `#16a34a` (5.1:1) | `#4ade80` (8.3:1) | Confirmaciones, estados activos, ATA/ATD |
| `--color-warning` | `#b45309` (5.3:1) | `#fbbf24` (9.1:1) | Alertas, días libres próximos a vencer |
| `--color-danger` | `#be123c` (5.5:1) | `#fb7185` (6.5:1) | Errores, ETA vencidos, demoras |
| `--color-info` | `#1d4ed8` (5.8:1) | `#60a5fa` (7.2:1) | Información, modo marítimo |

---

## 3. Tipografía

### Font Family

```css
/* Primaria — interfaz general */
font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;

/* Mono — códigos, consecutivos, DOs, AWB, contenedores */
font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, 'Cascadia Code', monospace;
```

**Regla:** Usar `font-mono` en Tailwind para: `do_number`, `consecutivo`, `container_number`, `air_waybill`, `NIT`, códigos de referencia.

### Escala tipográfica (Mobile-first)

| Rol | Clase Tailwind | Tamaño | Peso | Uso |
|-----|---------------|--------|------|-----|
| `erp-page-title` | `text-lg md:text-xl` | 18→20px | 700 | Título de página |
| `erp-page-subtitle` | `text-xs` | 12px | 400 | Descripción de página |
| Section heading | `text-sm font-semibold` | 14px | 600 | Títulos de sección en card |
| Card label | `erp-label` | 10px | 700 | Labels de formulario, headers de columna |
| Body / Row data | `text-xs` | 12px | 400-500 | Contenido de tabla, body text |
| Metadata | `text-[11px]` | 11px | 400 | Subtextos, timestamps |
| Caption | `text-[10px]` | 10px | 400-600 | Badges, tags, pills |

### Uso de pesos

| Peso | Clase | Uso |
|------|-------|-----|
| 900 (`font-black`) | `erp-kpi-value` | Valores KPI únicamente |
| 700 (`font-bold`) | Títulos, botones CTA | Títulos de página, btn-primary |
| 600 (`font-semibold`) | Subheadings, btn-secondary | Labels activos, acciones secundarias |
| 500 (`font-medium`) | Nav items, body enfatizado | Texto de navegación, etiquetas |
| 400 (`font-normal`) | Datos de tabla, cuerpo general | Contenido estándar |

### Letter-spacing

| Contexto | Clase | Valor |
|----------|-------|-------|
| Títulos de página | `tracking-tight` | -0.015em |
| Labels y headers de tabla | `tracking-widest` | 0.1em |
| Codes y consecutivos | `tracking-wider` | 0.05em |
| KPI values | `tracking-tight` | -0.02em |

---

## 4. Espaciado y Layout

### Escala de espaciado base: múltiplos de 4px

```
1 = 4px   2 = 8px   3 = 12px  4 = 16px  5 = 20px
6 = 24px  8 = 32px  10 = 40px 12 = 48px 16 = 64px
```

### Padding de página (contenedor principal)

```
Mobile  (< 640px):  p-3  (12px)
Tablet  (≥ 768px):  p-4  (16px)
Desktop (≥ 1024px): p-6  (24px)
```

Clase a usar en `<main>`: `p-3 sm:p-4 lg:p-6`

### Gap de grids

```
Entre cards KPI:     gap-3  (12px) — denso, información compacta
Entre secciones:     gap-4  (16px) — estándar
Entre páginas/forms: gap-5  (20px) — respira bien
Entre sections:      gap-6  (24px) — máximo en ERP
```

### Stack de formularios

```
Entre campo y label:    mb-1.5 (6px)
Entre campos de form:   space-y-4 (16px)
Entre secciones de form: space-y-6 (24px)
```

---

## 5. Elevación y sombras

Las sombras refuerzan la jerarquía de superficie. Siempre usar los tokens, no clases Tailwind de sombra.

| Token | Valor claro | Uso |
|-------|------------|-----|
| `--shadow-sm` | `0 1px 2px rgba(14,24,40,0.05)` | KPI cards, elementos mínimos |
| `--shadow-card` | `0 1px 3px rgba(14,24,40,0.08), 0 1px 2px rgba(14,24,40,0.04)` | Cards estándar, topbar, tablas |
| `--shadow-raised` | `0 4px 16px rgba(14,24,40,0.10), 0 2px 6px rgba(14,24,40,0.06)` | Modales, dropdowns, overlays |
| `--shadow-overlay` | `0 20px 50px rgba(14,24,40,0.16), 0 6px 20px rgba(14,24,40,0.08)` | Login card, modales importantes |

---

## 6. Bordes y radio

### Border-radius (redondeado)

| Clase Tailwind | Valor | Uso |
|---------------|-------|-----|
| `rounded-sm` | 4px | Badges pequeños, tags compactos |
| `rounded-lg` | 8px | Botones ghost, chips de filtro |
| `rounded-xl` | 12px | Inputs, selects, botones principales, filter bars |
| `rounded-2xl` | 16px | Cards, modales, KPI cards |
| `rounded-full` | 9999px | Avatar, badges pill, scrollbar |

### Border-width

```
Default:  1px   → border (mayoría de cards e inputs)
Focused:  1.5px → border-[1.5px] (inputs y botones para énfasis de estado)
Accent:   2px   → border-2 (elementos seleccionados, KPI activo)
```

---

## 7. Iconografía

**Librería exclusiva:** `lucide-react` — NO usar otras librerías de íconos.

### Tamaños de íconos

| Contexto | Clase | Uso |
|---------|-------|-----|
| Inline en texto pequeño | `w-3 h-3` | Badges, captions |
| Botón small / inline | `w-3.5 h-3.5` | Botones compact, nav subtitles |
| Estándar UI | `w-4 h-4` | Botones estándar, form icons |
| Nav sidebar | `w-[18px] h-[18px]` | Items de navegación |
| Feature / header | `w-5 h-5` | Headers de sección, security badge |
| Hero / brand | `w-7 h-7` o `w-8 h-8` | Logo mark en sidebar, login |

### Color de íconos
- Íconos en sidebar: heredan color de nav item (`--nav-text` / `--nav-text-active`)
- Íconos en inputs (decorativos): `--text-disabled`
- Íconos en botones: heredan color del botón (`text-white` en primary, `--text-secondary` en secondary)
- Íconos de estado: usar el color semántico correspondiente (`--color-success`, `--color-danger`, etc.)

---

## 8. Componentes

### 8.1 Botones

#### Variantes

```jsx
// PRIMARY — acción principal de la pantalla. Máximo 1 por vista.
<button className="erp-btn-primary">
  <Plus className="w-4 h-4" />
  <span>Nueva Carga</span>
</button>

// SECONDARY — acciones secundarias o complementarias.
<button className="erp-btn-secondary">
  <RefreshCw className="w-3.5 h-3.5" />
  <span>Actualizar</span>
</button>

// GHOST — acciones terciarias, links tipo botón.
<button className="erp-btn-ghost">
  <span>Ver todos</span>
</button>

// DANGER — acciones destructivas. Siempre pedir confirmación.
<button className="erp-btn-danger">
  <Trash2 className="w-3.5 h-3.5" />
  <span>Eliminar</span>
</button>

// ICON-ONLY — en toolbars o acciones de tabla.
<button className="erp-icon-btn">
  <Eye className="w-4 h-4" />
</button>

// ICON-ONLY con hover naranja:
<button className="erp-icon-btn erp-icon-btn-orange">
  <MessageSquarePlus className="w-4 h-4" />
</button>
```

#### Tamaños

```
SM  → px-3 py-1.5 text-[11px] — acciones en tabla, chips
MD  → px-4 py-2 text-xs       — estándar (default de erp-btn-*)
LG  → px-5 py-2.5 text-sm     — CTA de página, botón de submit en formularios
```

#### Reglas de uso

1. **Solo un botón Primary por vista** — es el CTA principal.
2. **Orden izquierda a derecha:** Secundario → Ghost → Primary (en grupos de acciones).
3. **Orden en modales:** Cancel (secondary) → Confirmar (primary), alineados a la derecha.
4. **Estado loading:** Spinner `<Loader2 className="w-4 h-4 animate-spin" />` reemplaza al ícono.
5. **Estado disabled:** `disabled:opacity-40 disabled:pointer-events-none` — ya incluido en la clase base.
6. **Active scale:** `active:scale-[0.97]` — ya incluido, da feedback táctil.

### 8.2 Inputs y Formularios

```jsx
// Label siempre encima del input
<div>
  <label className="erp-label">Nombre del campo</label>
  <input type="text" className="erp-input" placeholder="..." />
</div>

// Input con ícono decorativo (izquierda)
<div className="relative">
  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-disabled)' }} />
  <input type="text" className="erp-input pl-10" />
</div>

// Select
<select className="erp-select">
  <option>Opción</option>
</select>

// Textarea
<textarea className="erp-textarea" rows={3} />

// Search (en filter bars, compact)
<input className="erp-search-input" placeholder="Buscar..." />

// Select en filter bar (compact)
<select className="erp-filter-select">...</select>
```

#### Reglas de formularios

1. **Stack vertical siempre** — nunca inputs side-by-side en mobile. En desktop (`md:grid-cols-2`) sí.
2. **Spacing:** `space-y-4` entre campos, `space-y-6` entre secciones del formulario.
3. **Label:** Siempre `erp-label` — 10px, bold, uppercase, tracking-widest.
4. **Placeholder:** Color `--text-disabled` — NO usar texto de ejemplo como única guía.
5. **Error en campo:** Border rojo `border-[var(--color-danger)]`, mensaje debajo en `--color-danger`.
6. **Required:** El campo debe ser obvio visualmente (no solo el atributo HTML `required`).

### 8.3 Cards

```jsx
// Card estándar — para la mayoría de secciones
<div className="erp-card">
  contenido
</div>

// Card sutil — para elementos anidados, sidebars de cards
<div className="erp-card-subtle">
  contenido
</div>
```

#### Mobile-first para cards

```
Mobile:  Ocupan ancho completo (w-full, sin margen lateral)
Tablet:  Grid de 2 columnas (sm:grid-cols-2)
Desktop: Grid de 3+ columnas (lg:grid-cols-3)
```

### 8.4 Tablas

```jsx
<div className="erp-table-container">
  <table className="erp-table">
    <thead>
      <tr>
        <th className="erp-th">Columna</th>
      </tr>
    </thead>
    <tbody>
      <tr className="erp-tr">  {/* ← cursor-pointer, hover automático en CSS */}
        <td className="erp-td">dato</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### Reglas de tablas

1. **Mobile:** Las tablas tienen scroll horizontal — `overflow-x-auto` ya incluido en `erp-table-container`.
2. **Columnas en mobile:** Priorizar las más importantes. Columnas secundarias pueden ocultarse con `hidden md:table-cell`.
3. **Densidad:** Padding `py-3 px-4` en desktop. En mobile puede reducirse a `py-2 px-3`.
4. **Texto de datos numéricos:** `font-mono text-right` para alineación correcta.
5. **Filas vacías:** Mensaje centrado con `--text-muted`, padding `py-12`.
6. **Loading:** Skeleton o spinner centrado.

### 8.5 Badges y estados

```jsx
// Naranja — marca, estados pendientes, sin confirmar
<span className="erp-badge-orange">EXPO</span>

// Verde — éxito, activo, confirmado, ATA recibido
<span className="erp-badge-emerald">Activo</span>

// Azul — información, marítimo, en proceso
<span className="erp-badge-blue">En Tránsito</span>

// Rojo — error, vencido, urgente
<span className="erp-badge-danger">VENCIDO</span>

// Amarillo — alerta, próximo a vencer, warning
<span className="erp-badge-warning">3 días</span>

// Slate — estados neutros, inactivo, sin asignar
<span className="erp-badge-slate">Sin estado</span>

// Status chip (más grande, para estado operativo en tabla)
<span className="erp-status-chip">En aduana nacional</span>
```

#### Mapeo de estados operativos

| Estado | Badge | Color semántico |
|--------|-------|-----------------|
| Confirmado / Activo | `erp-badge-emerald` | success |
| En tránsito / Navegando | `erp-badge-blue` | info |
| En aduana / Proceso | `erp-badge-orange` | brand |
| ETA vencido / Demora | `erp-badge-danger` | danger |
| Días libres < 3 | `erp-badge-warning` | warning |
| Sin estado / N/A | `erp-badge-slate` | neutral |

### 8.6 Modales (Anatomía Senior UX/UI — Viewport Contained)

Todos los modales deben estructurarse obligatoriamente con el patrón de 3 zonas:
1. `erp-modal-header`: Pinned en el tope (`shrink-0`). Icono, título y botón `X` de cierre siempre visibles.
2. `erp-modal-body`: Cuerpo desplazable con `overflow-y: auto` y `overscroll-behavior: contain`. Nunca se corta ni empuja el modal fuera de la pantalla.
3. `erp-modal-footer`: Pinned en la base (`shrink-0`). Acciones primarias y secundarias siempre accesibles.

```jsx
<div className="erp-modal-overlay">
  <div className="erp-modal max-w-lg">
    {/* 1. Header Pinned */}
    <div className="erp-modal-header">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
             style={{ backgroundColor: 'var(--brand-orange-dim)', color: 'var(--brand-orange-text)' }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="erp-page-title text-base">Título del Modal</h2>
          <p className="erp-page-subtitle">Descripción breve</p>
        </div>
      </div>
      <button className="erp-icon-btn shrink-0" onClick={onClose} aria-label="Cerrar modal">
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* 2. Form & Scrollable Body */}
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="erp-modal-body space-y-4">
        {/* Controles de formulario, cards o tablas */}
      </div>

      {/* 3. Footer Pinned */}
      <div className="erp-modal-footer">
        <button type="button" className="erp-btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="erp-btn-primary">
          Guardar Cambios
        </button>
      </div>
    </form>
  </div>
</div>
```

#### Tamaños de modal

```
SM: max-w-sm  (384px)  — confirmaciones simples
MD: max-w-lg  (512px)  — formularios estándar (default)
LG: max-w-2xl (672px)  — formularios complejos
XL: max-w-4xl (896px)  — vistas de detalle en modal
```

### 8.7 KPI Cards

```jsx
<button className="erp-kpi-card" onClick={...}
        style={isActive ? { borderColor: 'var(--brand-orange)', boxShadow: '0 0 0 2px var(--brand-orange-ring)' } : {}}>
  <div className="erp-kpi-label">
    <Icon className="w-3.5 h-3.5" />
    Total Activas
  </div>
  <div className="erp-kpi-value">42</div>
</button>
```

**Grid de KPI (mobile-first):**
```
Mobile:  grid-cols-2         (2 por fila)
Tablet:  sm:grid-cols-3      (3 por fila)
Desktop: md:grid-cols-5      (todos en fila)
```

### 8.8 Navigation

El sidebar es siempre navy oscuro (`--sidebar-bg: #14213d`) en ambos modos. Ver `AppLayout.tsx` como referencia implementada.

**Logo mark:** Siempre usar `PackageCheck` de lucide-react con gradiente `from-[#F35815] to-orange-700`.

---

## 9. Breakpoints — Mobile first

### Estrategia general

```
Todo layout parte de mobile (0px) y se expande con prefijos Tailwind.
NUNCA usar un clase sin prefijo que solo sirve en desktop.
```

### Layouts responsivos estándar

```jsx
// Grid de cards — mobile 1 col, tablet 2, desktop 3+
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Grid de KPI — mobile 2, tablet 3, desktop 5
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">

// Form de dos columnas — stacked en mobile, grid en tablet
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Barra de filtros — stacked en mobile, horizontal en tablet
<div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">

// Header de página — stacked en mobile, side-by-side en tablet
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
```

### Sidebar (AppLayout)

```
Mobile  (< 1024px): sidebar oculto o drawer
Desktop (≥ 1024px): sidebar fijo w-60 (expandido) o w-[72px] (collapsed)
```

> **TODO pendiente:** Implementar drawer/hamburger menu para mobile en AppLayout.

### Padding de contenido responsivo

```jsx
// Main content area
<main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">

// Espaciado interno de secciones  
<div className="space-y-4 lg:space-y-6">
```

---

## 10. Animaciones y transiciones

**Duración estándar:** `transition-all duration-150` o `transition-colors`

| Tipo | Clase Tailwind | Cuándo usar |
|------|---------------|-------------|
| Color/bg change | `transition-colors` | Hover en botones, links, nav items |
| All properties | `transition-all` | Cuando cambia también tamaño, sombra o borde |
| Transform only | `transition-transform` | Hover lift de cards (`-translate-y-1`) |
| Spinner | `animate-spin` | Loading states |
| Pulse | `animate-pulse` | Loading skeletons, dot de presencia |

**Active feedback:** `active:scale-[0.97]` — incluido en todos los botones.

**Sidebar collapse:** `transition-all duration-300` — transición suave de 300ms.

---

## 11. Accesibilidad

### Contraste mínimo (WCAG AA)
- Texto normal (< 18px): **4.5:1** mínimo
- Texto grande (≥ 18px bold): **3:1** mínimo
- Todos los tokens `--text-*` cumplen esto excepto `--text-disabled` (solo para placeholders/disabled)

### Focus visible
- Inputs: `box-shadow: 0 0 0 3px var(--brand-orange-ring)` + `border-color: var(--brand-orange)`
- Botones: el outline nativo o el ring de 3px naranja
- NUNCA `focus:outline-none` sin un focus visible alternativo

### ARIA y semántica
- Tablas: usar `<th scope="col">` en headers
- Botones icon-only: siempre `title="descripción"` o `aria-label`
- Modales: `role="dialog"` con `aria-modal="true"` y `aria-label`
- Estados de carga: `aria-busy="true"` en el contenedor

### Touch targets (mobile)
- Mínimo **44×44px** para elementos interactivos en mobile
- Los botones icon-only tienen `p-2` para alcanzar el mínimo táctil

---

## Apéndice — Referencia rápida de clases ERP

```
LAYOUT:
erp-card, erp-card-subtle, erp-card-interactive

TIPOGRAFÍA:
erp-page-title, erp-page-subtitle, erp-label
erp-text, erp-text-secondary, erp-text-muted
erp-surface, erp-surface-raised, erp-border

FORMS:
erp-input, erp-select, erp-textarea
erp-search-input, erp-filter-select, erp-filter-bar

BUTTONS:
erp-btn-primary, erp-btn-secondary, erp-btn-ghost
erp-btn-danger, erp-icon-btn, erp-icon-btn-orange

TABLES:
erp-table-container, erp-table, erp-th, erp-td, erp-tr

DATA:
erp-kpi-card, erp-kpi-label, erp-kpi-value
erp-badge-orange, erp-badge-emerald, erp-badge-blue
erp-badge-danger, erp-badge-warning, erp-badge-slate
erp-status-chip

OVERLAYS:
erp-modal-overlay, erp-modal

UTILS:
erp-divider
```
