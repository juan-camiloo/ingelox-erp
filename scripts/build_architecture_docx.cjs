const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  PageBreak,
} = require('docx');

// ── PALETA DE COLORES CORPORATIVOS INGELOX ─────────────────────────
const COLOR_PRIMARY = 'EA580C';       // Naranja Ingelox Principal
const COLOR_SECONDARY = '0F172A';     // Azul Noche / Slate Oscuro
const COLOR_BLUE = '0284C7';          // Azul Acceso / Red
const COLOR_EMERALD = '10B981';       // Verde Aprobado
const COLOR_TEXT = '1E293B';          // Texto Principal
const COLOR_MUTED = '64748B';         // Texto Secundario
const COLOR_BG_LIGHT = 'F8FAFC';      // Fondo Filas Pares
const COLOR_CODE_BG = 'F1F5F9';       // Fondo Bloques Código
const COLOR_BORDER = 'CBD5E1';        // Borde Suave
const COLOR_BORDER_LIGHT = 'E2E8F0';  // Borde Interno

// ── ESTILOS DE BORDE ───────────────────────────────────────────────
const borderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const borderTable = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER_LIGHT },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER_LIGHT },
};

// ── UTILIDADES DE TIPOGRAFÍA Y PÁRRAFOS ─────────────────────────────
function titleRun(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 44, // 22pt
        color: COLOR_SECONDARY,
        font: 'Arial',
      }),
    ],
  });
}

function subtitleRun(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 240 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
        color: COLOR_PRIMARY,
        font: 'Arial',
      }),
    ],
  });
}

function metaRun(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({
        text,
        size: 18, // 9pt
        color: COLOR_MUTED,
        font: 'Arial',
      }),
    ],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
        color: COLOR_PRIMARY,
        font: 'Arial',
      }),
    ],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22, // 11pt
        color: COLOR_SECONDARY,
        font: 'Arial',
      }),
    ],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 19, // 9.5pt
        color: COLOR_MUTED,
        font: 'Arial',
      }),
    ],
  });
}

function p(text, options = {}) {
  return new Paragraph({
    alignment: options.align || AlignmentType.LEFT,
    spacing: { before: 40, after: 100 },
    children: [
      new TextRun({
        text,
        size: 20, // 10pt
        color: COLOR_TEXT,
        font: 'Arial',
        bold: !!options.bold,
        italics: !!options.italic,
      }),
    ],
  });
}

function callout(title, body) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_PRIMARY },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: 'FFF7ED', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 19,
                    color: COLOR_PRIMARY,
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: body,
                    size: 18,
                    color: COLOR_TEXT,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function codeBlock(codeText, title = 'Código Fuente Mermaid Editable') {
  const lines = codeText.split('\n');
  const codeParagraphs = [
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `[ ${title} ]`,
          bold: true,
          size: 15,
          color: COLOR_PRIMARY,
          font: 'Consolas',
        }),
      ],
    }),
  ];

  for (const line of lines) {
    codeParagraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: line || ' ',
            size: 15,
            color: '0F172A',
            font: 'Consolas',
          }),
        ],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 18, color: COLOR_BLUE },
      right: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_CODE_BG, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            children: codeParagraphs,
          }),
        ],
      }),
    ],
  });
}

function makeTable(headers, rowsData, widths, headerColor = COLOR_PRIMARY) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => {
      return new TableCell({
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        shading: { fill: headerColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: h,
                bold: true,
                size: 17,
                color: 'FFFFFF',
                font: 'Arial',
              }),
            ],
          }),
        ],
      });
    }),
  });

  const bodyRows = rowsData.map((row, rIdx) => {
    const isEven = rIdx % 2 === 1;
    return new TableRow({
      children: row.map((cellText, cIdx) => {
        return new TableCell({
          width: { size: widths[cIdx], type: WidthType.PERCENTAGE },
          shading: {
            fill: isEven ? COLOR_BG_LIGHT : 'FFFFFF',
            type: ShadingType.CLEAR,
          },
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: cellText,
                  size: 17,
                  color: COLOR_TEXT,
                  font: 'Arial',
                }),
              ],
            }),
          ],
        });
      }),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderTable,
    rows: [headerRow, ...bodyRows],
  });
}

// ── LECTURA DE ARCHIVOS MERMAID REALES DEL PROYECTO ─────────────────
const docsDiagramasPath = path.join(__dirname, '..', 'docs', 'diagramas');
const mmdCasosUso = fs.readFileSync(path.join(docsDiagramasPath, '01_casos_de_uso.mmd'), 'utf8');
const mmdArquitectura = fs.readFileSync(path.join(docsDiagramasPath, '02_arquitectura_sistema.mmd'), 'utf8');
const mmdSecuencias = fs.readFileSync(path.join(docsDiagramasPath, '03_secuencias_flujos_operativos.mmd'), 'utf8');
const mmdErd = fs.readFileSync(path.join(docsDiagramasPath, '04_modelo_entidad_relacion_erd.mmd'), 'utf8');
const mmdClases = fs.readFileSync(path.join(docsDiagramasPath, '05_diagrama_clases_uml.mmd'), 'utf8');
const mmdEstados = fs.readFileSync(path.join(docsDiagramasPath, '06_maquina_estados_trafico.mmd'), 'utf8');

// ── CONSTRUCCIÓN DEL DOCUMENTO COMPLETO ─────────────────────────────
async function generateDocx() {
  console.log('Generando documento Word: Propuesta_Arquitectura_INGELOX_ERP.docx...');

  const doc = new Document({
    creator: 'Antigravity AI / Ingelox Software Engineering Team',
    title: 'Propuesta de Arquitectura Técnica — Ingelox ERP',
    description: 'Documentación técnica completa, modelos UML editables y especificación de datos 3FN.',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 pulgada (2.54 cm)
          },
        },
        children: [
          // ── PORTADA EJECUTIVA ─────────────────────────────────────
          new Paragraph({ spacing: { before: 1200 } }),
          titleRun('PROPUESTA DE ARQUITECTURA TÉCNICA'),
          subtitleRun('INGELOX LOGISTICS ERP & TRACKING SYSTEM'),
          p('Plataforma Integral de Gestión Logística Internacional, Control de Tráfico & Portal de Seguimiento', { align: AlignmentType.CENTER, bold: true }),
          new Paragraph({ spacing: { before: 300, after: 300 } }),
          callout(
            'Información de la Solución',
            '• Empresa: Ingelox Logistics S.A.S.\n• Entorno: ERP Operativo + Portal Clientes Producción (como-va-mi-carga.ingelox.com.co)\n• Motor de Persistencia: PostgreSQL 15 en Supabase Cloud\n• Frontend: React 19 + TypeScript (Vite 8) con Tailwind CSS\n• Arquitectura de Datos: Tercera Forma Normal (3FN) con Dual-Store Resiliente\n• Fecha: Octubre 2026 · Versión: 2.5 Oficial'
          ),
          new Paragraph({ spacing: { before: 1800 } }),
          metaRun('CONFIDENCIAL & PROPIETARIO — PARA USO EXCLUSIVO DE INGELOX LOGISTICS'),
          metaRun('Documento con especificación técnica de ingeniería y modelos UML editables.'),
          new Paragraph({ children: [new PageBreak()] }),

          // ── 1. ALCANCE DEL SISTEMA ─────────────────────────────────
          h1('1. Alcance del Sistema'),
          p('El sistema Ingelox ERP tiene como propósito centralizar la operación integral de freight forwarding y agenciamiento de aduanas, enlazando fluidamente el ciclo comercial de cotizaciones con las instrucciones de embarque, el control riguroso de tráfico en ruta y la publicación en tiempo real hacia el portal público de clientes.'),
          
          h2('1.1 Funcionalidades Dentro del Alcance'),
          makeTable(
            ['#', 'Módulo', 'Funcionalidad Implementada', 'Beneficio Operativo'],
            [
              ['1', 'Comercial', 'Directorio de Terceros DIAN con cálculo de DV (Módulo 11)', 'Elimina errores de digitación fiscal en NITs y clasificación cliente/proveedor.'],
              ['2', 'Comercial', 'Catálogo de Conceptos Tarifarios & Estandarización de IVA', 'Control unificado de servicios de flete, recargos en origen y destino.'],
              ['3', 'Comercial', 'Cotizaciones Formales con ciclo de vida (Borrador/Enviada/Aprobada)', 'Cálculo dinámico de subtotales, IVA y neto con exportación PDF.'],
              ['4', 'Operaciones', 'Conversión 1-Clic de Oferta Aprobada a Instrucción de Embarque', 'Transfiere automáticamente cliente, oferta, asesor, vía, notas y tarifas.'],
              ['5', 'Operaciones', 'Exportación Oficial de Instrucción a Excel (.xlsx) y PDF', 'Genera la plantilla corporativa oficial idéntica mediante ExcelJS.'],
              ['6', 'Operaciones', 'Apertura Inmediata en Tráfico (Shipments / DO)', 'Precarga modo de transporte, origen/destino, Incoterm y transportadora.'],
              ['7', 'Tráfico', 'Monitoreo de Tráfico con Alertas de Retraso ETA y Días Libres', 'Detecta sobrecostos de demoras de contenedor antes del vencimiento.'],
              ['8', 'Tráfico', 'Registro de Novedad Rápida & Hito en Tiempo Real', 'Actualización atómica de estado con inserción en historial inmutable.'],
              ['9', 'Tráfico', 'Gestión Documental de Embarque (BL, Factura, Packing List)', 'Almacenamiento en buckets seguros de Supabase Storage.'],
              ['10', 'Tracking', 'Vinculación de Cargas a Empresas del Portal (company_shipment)', 'Permite que el cliente visualice su carga en como-va-mi-carga.ingelox.com.co.'],
              ['11', 'Seguridad', 'Control de Acceso Basado en Roles (RBAC & RLS)', 'Garantiza aislamiento estricto entre operadores internos y usuarios clientes.'],
              ['12', 'Arquitectura', 'Persistencia Híbrida Dual-Store para Módulo Comercial', 'Disponibilidad permanente con fallback local y sincronización con Supabase.'],
            ],
            [6, 18, 42, 34],
            COLOR_PRIMARY
          ),

          new Paragraph({ spacing: { before: 180 } }),
          h2('1.2 Funcionalidades Fuera del Alcance'),
          makeTable(
            ['#', 'Elemento Fuera del Alcance', 'Razón Técnica / Justificación'],
            [
              ['1', 'Pasarela de pagos en línea con débito bancario automático', 'Las transacciones de fletes y agenciamiento se liquidan por facturación electrónica DIAN a 30 días.'],
              ['2', 'Aplicaciones móviles nativas en tiendas (App Store / Play Store)', 'El sistema opera como Progressive Web Application (PWA) responsiva para cualquier dispositivo.'],
              ['3', 'Telemetría GPS por hardware satelital dedicado en contenedor', 'El tracking se sincroniza mediante hitos de navieras, aerolíneas y operadores de transporte terrestre.'],
              ['4', 'Contabilidad de causación contable general de nómina', 'Manejado por software contable externo especializado; el ERP exporta matrices consolidadas.'],
            ],
            [8, 42, 50],
            COLOR_SECONDARY
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ── 2. REQUISITOS FUNCIONALES ──────────────────────────────
          h1('2. Requisitos Funcionales Priorizados (RF)'),
          p('Los requisitos funcionales detallan las capacidades que el sistema proporciona a los operadores logísticos, directivos comerciales y clientes externos.'),
          makeTable(
            ['ID', 'Módulo', 'Descripción del Requisito', 'Prioridad', 'Criterio de Aceptación'],
            [
              ['RF-01', 'Terceros', 'Calcular automáticamente el dígito de verificación DIAN al ingresar el NIT.', 'Alta', 'Aplica algoritmo Módulo 11 sin recargar la página.'],
              ['RF-02', 'Cotizaciones', 'Crear, editar y liquidar ofertas comerciales multimoneda con desglose de IVA.', 'Alta', 'Calcula subtotales y genera vista previa/impresión PDF.'],
              ['RF-03', 'Instrucciones', 'Generar Instrucción de Embarque desde oferta aprobada con 1 clic.', 'Alta', 'Copia cliente, asesor, ruta, tarifas y comentarios sin reescribir.'],
              ['RF-04', 'Instrucciones', 'Exportar la instrucción en archivo Excel (.xlsx) con celdas y fórmulas oficiales.', 'Alta', 'El archivo generado coincide 100% con la plantilla maestra.'],
              ['RF-05', 'Tráfico', 'Apertura de expediente DO en Tráfico con prellenado desde instrucción.', 'Alta', 'Asigna DO, modo aéreo/marítimo/terrestre y desglosa origen/destino.'],
              ['RF-06', 'Tráfico', 'Tablero operativo con pestañas de alertas (ETA Vencido, Días Libres por Vencer).', 'Alta', 'Calcula días restantes de demoras según fecha ATA/ETA y días libres.'],
              ['RF-07', 'Tráfico', 'Registro de novedades rápidas con hito, ubicación y observación.', 'Alta', 'Actualiza shipments e inserta evento en shipment_updates.'],
              ['RF-08', 'Documentos', 'Adjuntar soportes de carga (BL, AWB, Factura) con descarga directa.', 'Media', 'Almacena metadatos en documents y binarios en Storage.'],
              ['RF-09', 'Tracking', 'Habilitar visualización de carga en el portal de clientes en producción.', 'Alta', 'Asocia empresa en company_shipment sin modificar tabla companies.'],
              ['RF-10', 'Búsqueda', 'Búsqueda global adaptativa en barra superior según módulo activo.', 'Media', 'Filtra en vivo la vista en pantalla según el término digitado.'],
            ],
            [10, 14, 40, 12, 24],
            COLOR_PRIMARY
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ── 3. REQUISITOS NO FUNCIONALES ───────────────────────────
          h1('3. Requisitos No Funcionales Medibles (RNF)'),
          p('Criterios de calidad, desempeño, resiliencia y seguridad que rigen la arquitectura:'),
          makeTable(
            ['ID', 'Atributo', 'Especificación y Métrica', 'Mecanismo de Implementación'],
            [
              ['RNF-01', 'Rendimiento', 'Tiempo de carga inicial del ERP inferior a 1.2 segundos sobre conexiones estándar.', 'Compilación optimizada Vite 8 con compresión gzip y code-splitting.'],
              ['RNF-02', 'Seguridad', 'Aislamiento de datos con cero fugas entre operadores y clientes externos.', 'Políticas PostgreSQL Row Level Security (RLS) evaluando auth.uid().'],
              ['RNF-03', 'Integridad', 'Cero impacto destructivo sobre el portal de clientes en producción.', 'Preservación estricta del esquema de tablas compartidas (companies, shipments).'],
              ['RNF-04', 'Resiliencia', 'Disponibilidad del módulo comercial y cotizaciones aun ante intermitencia de red.', 'Arquitectura Dual-Store con sincronización y almacenamiento local seguro.'],
              ['RNF-05', 'Tiempo Real', 'Propagación de novedades operativas al cliente en menos de 500 ms.', 'WebSockets con Supabase Realtime Engine (Publicación/Suscripción CDC).'],
              ['RNF-06', 'Portabilidad', 'Documentación y diagramas 100% editables en herramientas estándar.', 'Estándar Mermaid integrado en HTML, Markdown y Word (.docx).'],
            ],
            [12, 18, 38, 32],
            COLOR_SECONDARY
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ── 4. MATRIZ DE TRAZABILIDAD ──────────────────────────────
          h1('4. Matriz de Trazabilidad: Requisito vs Decisión de Arquitectura'),
          p('Esta matriz demuestra cómo cada requerimiento de negocio se respalda en una decisión arquitectónica concreta:'),
          makeTable(
            ['Requisito', 'Decisión de Arquitectura Adoptada', 'Justificación Técnica & Beneficio'],
            [
              ['Pipeline sin reprocesos (RF-03, RF-05)', 'Navegación asistida por SearchParams (?quotationId=..., ?instructionId=...)', 'Enlaza los 3 módulos con 1 clic sin alterar esquemas de BD ni generar dependencias rígidas.'],
              ['Protección de Producción (RNF-03)', 'Respeto al esquema nativo de companies (id, name, created_at)', 'Evita errores de columnas inexistentes como nit o phone en la base de datos de producción.'],
              ['Plantillas Excel Oficiales (RF-04)', 'Motor de renderizado binario en cliente con ExcelJS', 'Genera archivos .xlsx nativos con estilos corporativos sin sobrecargar servidores backend.'],
              ['Trazabilidad inmutable (RF-07)', 'Separación de entidad shipments de su historial shipment_updates', 'Garantiza auditoría histórica en 3FN donde cada novedad es un evento temporal independiente.'],
              ['Seguridad Multi-inquilino (RNF-02)', 'Políticas RLS en PostgreSQL basadas en el flag is_internal', 'El motor de base de datos descarta consultas no autorizadas a nivel de fila antes de enviarlas al cliente.'],
            ],
            [22, 38, 40],
            COLOR_BLUE
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ── 5. DIAGRAMA DE CASOS DE USO ────────────────────────────
          h1('5. Diagrama de Casos de Uso (UML)'),
          p('El modelo de Casos de Uso organiza las interacciones del sistema según los cinco actores clave: Administrador, Operador de Tráfico, Asesor Comercial, Cliente Tracking y Motor Supabase/PostgreSQL.'),
          callout(
            'Interacción Central del Pipeline',
            'El flujo operacional conecta los casos de uso: Elaborar Cotización ➔ Convertir en Instrucción (<<include>>) ➔ Apertura en Tráfico (<<include>>) ➔ Vincular a Empresa Cliente (<<include>>) ➔ Registro de Historial en Tiempo Real (<<notify>>).'
          ),
          new Paragraph({ spacing: { before: 140 } }),
          codeBlock(mmdCasosUso, 'Diagrama 01: Casos de Uso (UML) — Mermaid Editable'),

          new Paragraph({ children: [new PageBreak()] }),

          // ── 6. ARQUITECTURA DEL SISTEMA EN 3 CAPAS ─────────────────
          h1('6. Arquitectura del Sistema (3 Capas) & Componentes'),
          p('La solución se estructura bajo una arquitectura multi-capa desacoplada que asegura alta mantenibilidad, escalabilidad y tolerancia a fallos.'),
          
          h2('6.1 Descripción de las Capas'),
          p('• Capa 1: Presentación (Frontend SPA): Aplicación de página única desarrollada en React 19 y TypeScript, optimizada mediante Vite 8 y estilizada con Tailwind CSS y tokens de diseño corporativo Ingelox.'),
          p('• Capa 2: Servicios de Negocio & Dominio: Implementa la lógica de conversión del pipeline comercial, validación fiscal DIAN Módulo 11, cálculo de vencimientos de contenedores y motores de exportación ExcelJS/PDF.'),
          p('• Capa 3: Nube y Persistencia (Supabase BaaS): PostgreSQL 15 como motor relacional primario, Supabase Auth para autenticación JWT, Realtime Engine para sincronización por WebSockets y Storage para archivos adjuntos.'),
          p('• Enlace Externo: Integración con el portal de clientes en producción (como-va-mi-carga.ingelox.com.co) a través de la tabla relacional company_shipment.'),
          
          new Paragraph({ spacing: { before: 140 } }),
          codeBlock(mmdArquitectura, 'Diagrama 02: Arquitectura del Sistema (3 Capas) — Mermaid Editable'),

          new Paragraph({ children: [new PageBreak()] }),

          // ── 7. DIAGRAMAS DE SECUENCIA ──────────────────────────────
          h1('7. Diagramas de Secuencia (UML)'),
          p('Se modelan cuatro flujos temporales que reflejan la dinámica de intercambio de mensajes entre actores, interfaces de usuario y servicios de persistencia.'),

          h2('7.1 Flujo A: Pipeline Comercial a Tráfico'),
          p('Ilustra el ciclo completo desde que el asesor comercial elabora la cotización, el cliente la aprueba, el operador logístico la convierte a instrucción de embarque y finalmente se apertura el expediente en control de tráfico con visualización inmediata en el portal de seguimiento.'),
          
          h2('7.2 Flujo B: Registro de Novedad Rápida & Notificación Realtime'),
          p('Describe el registro de un nuevo hito de tráfico (ej. Zarpe en origen) y la emisión instantánea vía WebSockets que actualiza el timeline del cliente sin requerir recarga de pantalla.'),

          new Paragraph({ spacing: { before: 140 } }),
          codeBlock(mmdSecuencias, 'Diagrama 03: Diagramas de Secuencia (UML) — Mermaid Editable'),

          new Paragraph({ children: [new PageBreak()] }),

          // ── 8. MODELO ENTIDAD-RELACIÓN (MER / DER EN 3FN) ──────────
          h1('8. Modelo Entidad-Relación (MER / DER en 3FN)'),
          p('El modelo de datos relacional se encuentra rigurosamente normalizado en Tercera Forma Normal (3FN), eliminando redundancias, anomalías de actualización y dependencias transitivas.'),

          h2('8.1 Justificación de Normalización en 3FN'),
          p('• 1FN (Atomicidad): Cada campo contiene valores atómicos e indivisibles. No existen listas ni arrays desestructurados; los conceptos y desgloses se modelan en tablas subordinadas (quotation_items, shipping_instruction_concepts).'),
          p('• 2FN (Dependencia Completa): Todos los atributos no clave dependen en su totalidad de la clave primaria, eliminando dependencias parciales en tablas con clave compuesta como company_shipment.'),
          p('• 3FN (Sin Dependencias Transitivas): Ningún atributo no clave depende de otro atributo no clave. Por ejemplo, en shipment_updates se almacena únicamente el identificador updated_by referenciando a profiles, sin duplicar datos del usuario.'),

          h2('8.2 Catálogo de Entidades del Sistema (12 Tablas)'),
          makeTable(
            ['Esquema', 'Tabla', 'Clave Primaria', 'Propósito Principal'],
            [
              ['Tráfico / Tracking', 'companies', 'id (UUID)', 'Cuentas maestras de empresas en el portal de seguimiento.'],
              ['Tráfico / Tracking', 'profiles', 'id (UUID)', 'Usuarios, operadores y roles vinculados a auth.users.'],
              ['Tráfico / Tracking', 'company_shipment', 'company_id, shipment_id', 'Relación N:M que asocia expedientes de tráfico a empresas clientes.'],
              ['Tráfico / Tracking', 'shipments', 'id (UUID)', 'Expedientes operativos DO, fechas ETD/ETA y datos de transporte.'],
              ['Tráfico / Tracking', 'shipment_updates', 'id (UUID)', 'Historial inmutable de novedades, hitos y auditoría de ruta.'],
              ['Tráfico / Tracking', 'documents', 'id (UUID)', 'Metadatos de documentos BL, guías y facturas en Storage.'],
              ['Comercial Practiko', 'third_parties', 'id (UUID)', 'Directorio fiscal de clientes y proveedores con cálculo DIAN DV.'],
              ['Comercial Practiko', 'billing_concepts', 'id (UUID)', 'Catálogo estandarizado de conceptos tarifarios e IVA.'],
              ['Comercial Practiko', 'quotations', 'id (UUID)', 'Cabecera de cotizaciones comerciales con cálculo de subtotales.'],
              ['Comercial Practiko', 'quotation_items', 'id (UUID)', 'Desglose detallado de renglones y tarifas en cotizaciones.'],
              ['Comercial Practiko', 'shipping_instructions', 'id (TEXT)', 'Instrucciones de embarque previas a la apertura de tráfico.'],
              ['Comercial Practiko', 'shipping_instruction_concepts', 'id (TEXT)', 'Desglose de conceptos de venta y costo en la instrucción.'],
            ],
            [22, 26, 22, 30],
            COLOR_PRIMARY
          ),

          new Paragraph({ spacing: { before: 180 } }),
          codeBlock(mmdErd, 'Diagrama 04: Modelo Entidad-Relación (MER 3FN) — Mermaid Editable'),

          new Paragraph({ children: [new PageBreak()] }),

          // ── 9. DIAGRAMA DE CLASES UML ──────────────────────────────
          h1('9. Diagrama de Clases UML del Dominio'),
          p('Refleja la arquitectura orientada a objetos de los tipos TypeScript, interfaces de datos y métodos computados utilizados en la capa de servicios del ERP.'),
          codeBlock(mmdClases, 'Diagrama 05: Diagrama de Clases UML — Mermaid Editable'),

          new Paragraph({ children: [new PageBreak()] }),

          // ── 10. MÁQUINA DE ESTADOS DE TRÁFICO ──────────────────────
          h1('10. Máquina de Estados y Ciclos de Vida Logísticos'),
          p('Autómata de estados finitos que gobierna las transiciones en el ciclo de vida de operaciones de Exportación (EXPO) e Importación (IMPO):'),
          makeTable(
            ['Paso', 'Hito EXPO (Exportación)', 'Hito IMPO (Importación)', 'Efecto en el Sistema'],
            [
              ['1', 'Inicio de Operación (expo_start_operation)', 'Inicio de Operación (impo_start_operation)', 'Radicación formal del DO en el tablero de control.'],
              ['2', 'Confirmación Booking (expo_booking_confirmation)', 'Confirmación Booking (impo_booking_confirmation)', 'Asignación de reserva naviera o guía aérea master.'],
              ['3', 'Posicionamiento Vehículo (expo_vehicle)', 'Salida / Zarpe en Origen (impo_departure)', 'Retiro de contenedor vacío o inicio de viaje internacional.'],
              ['4', 'Documentación / Cutoff (expo_documentation)', 'Tránsito Internacional (impo_international_transit)', 'Aprobación de vistos buenos o navegación a Colombia.'],
              ['5', 'Salida / Zarpe (expo_departure)', 'Arribo a Puerto Destino (impo_arrival_confirmation)', 'Salida física de puerto y emisión de trazabilidad.'],
              ['6', 'Tránsito Internacional (expo_international_transit)', 'Desaduanamiento / DIAN (impo_customs_clearance)', 'Navegación internacional o trámites de inspección aduanera.'],
              ['7', 'Llegada a Destino (expo_arrival_confirmation)', 'Entrega Final en Bodega (impo_final_delivery)', 'Cierre exitoso del expediente de tráfico.'],
            ],
            [8, 30, 30, 32],
            COLOR_PRIMARY
          ),

          new Paragraph({ spacing: { before: 180 } }),
          codeBlock(mmdEstados, 'Diagrama 06: Máquina de Estados (State Diagram) — Mermaid Editable'),

          new Paragraph({ children: [new PageBreak()] }),

          // ── 11. MATRIZ DE CONTROL DE ACCESO RBAC & RLS ─────────────
          h1('11. Matriz de Control de Acceso por Rol (RBAC & RLS)'),
          p('Define los privilegios de operación garantizados tanto en los componentes de la interfaz de usuario como por las directivas Row Level Security en la base de datos:'),
          makeTable(
            ['Rol / Identidad', 'Módulo / Tabla', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'Alcance y Restricción'],
            [
              ['Operador / Admin ERP', 'shipments (Tráfico)', 'Total', 'Total', 'Total', 'Total', 'Acceso pleno a todos los expedientes de la empresa.'],
              ['Operador / Admin ERP', 'shipment_updates', 'Total', 'Total', 'Total', 'Total', 'Reporta novedades, hitos y observaciones en ruta.'],
              ['Operador / Admin ERP', 'Cotizaciones & Instrucciones', 'Total', 'Total', 'Total', 'Total', 'Gestión comercial completa en Practiko ERP.'],
              ['Operador / Admin ERP', 'Terceros & Conceptos', 'Total', 'Total', 'Total', 'Total', 'Mantenimiento del catálogo fiscal y tarifario.'],
              ['Cliente Portal Tracking', 'shipments', 'Asignadas', 'Denegado', 'Denegado', 'Denegado', 'Únicamente visualiza cargas vinculadas en company_shipment.'],
              ['Cliente Portal Tracking', 'shipment_updates', 'Asignadas', 'Denegado', 'Denegado', 'Denegado', 'Consulta la trazabilidad de sus propios despachos.'],
              ['Cliente Portal Tracking', 'documents', 'Descarga', 'Denegado', 'Denegado', 'Denegado', 'Descarga copias de BL, facturas y packing list.'],
              ['Cliente Portal Tracking', 'Módulos Comerciales', 'Denegado', 'Denegado', 'Denegado', 'Denegado', 'Acceso denegado a cotizaciones e instrucciones internas.'],
            ],
            [18, 22, 10, 10, 10, 10, 20],
            COLOR_SECONDARY
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ── 12. SCRIPT DDL POSTGRESQL 15 ───────────────────────────
          h1('12. Script DDL de Base de Datos PostgreSQL 15 (Supabase)'),
          p('A continuación se presenta el script DDL ejecutable en el SQL Editor de Supabase para la creación de esquemas, llaves foráneas e índices de alta velocidad:'),
          codeBlock(
`-- ═══════════════════════════════════════════════════════════════════
-- INGELOX ERP & TRACKING SYSTEM — SCHEMA DDL POSTGRESQL 15
-- ═══════════════════════════════════════════════════════════════════

-- 1. TABLA: companies (Portal Tracking en Producción)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: profiles (Usuarios & Operadores)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(120) NOT NULL UNIQUE,
  nickname VARCHAR(80),
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: shipments (Expedientes DO)
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  do_number VARCHAR(50) NOT NULL UNIQUE,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  shipment_type VARCHAR(20) DEFAULT 'maritime',
  current_status VARCHAR(50) NOT NULL DEFAULT 'expo_start_operation',
  incoterm VARCHAR(20),
  etd DATE,
  eta DATE,
  atd TIMESTAMPTZ,
  ata TIMESTAMPTZ,
  documentary_cutoff TIMESTAMPTZ,
  booking_status VARCHAR(30) DEFAULT 'confirmed',
  inspection_status VARCHAR(30) DEFAULT 'none',
  cargo_type VARCHAR(50) DEFAULT 'general',
  free_days INTEGER,
  carrier VARCHAR(100),
  flight_vessel VARCHAR(100),
  air_waybill VARCHAR(50),
  container_number VARCHAR(50),
  exporter VARCHAR(150),
  consignee VARCHAR(150),
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: company_shipment (Asociación N:M)
CREATE TABLE IF NOT EXISTS public.company_shipment (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, shipment_id)
);

-- 5. TABLA: shipment_updates (Historial Inmutable)
CREATE TABLE IF NOT EXISTS public.shipment_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  observation TEXT,
  location VARCHAR(150),
  event_type VARCHAR(50) DEFAULT 'status_update',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: documents (Soportes)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  storage_path VARCHAR(255),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES DE ALTA CONCURRENCIA
CREATE INDEX IF NOT EXISTS idx_shipments_do ON public.shipments(do_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(current_status);
CREATE INDEX IF NOT EXISTS idx_updates_shipment ON public.shipment_updates(shipment_id);
CREATE INDEX IF NOT EXISTS idx_comp_shipment ON public.company_shipment(company_id, shipment_id);`,
            'Script DDL PostgreSQL 15 — Supabase SQL Editor'
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  
  // Guardar en la raíz y en docs/
  const outRoot = path.join(__dirname, '..', 'Propuesta_Arquitectura_INGELOX_ERP.docx');
  const outDocs = path.join(__dirname, '..', 'docs', 'Propuesta_Arquitectura_INGELOX_ERP.docx');

  fs.writeFileSync(outRoot, buffer);
  fs.writeFileSync(outDocs, buffer);

  console.log(`✅ Documento Word generado exitosamente:`);
  console.log(`   - ${outRoot} (${buffer.length} bytes)`);
  console.log(`   - ${outDocs} (${buffer.length} bytes)`);
}

generateDocx().catch((err) => {
  console.error('Error generando documento DOCX:', err);
  process.exit(1);
});
