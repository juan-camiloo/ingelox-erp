import type { ShippingInstruction, ShippingInstructionConcept } from '../types/commercial';

function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(value: string | number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return String(value);
  const cur = currency.toUpperCase();
  const formatted = cur === 'COP'
    ? num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${cur} ${formatted}`;
}

export function buildInstructionHtml(
  instruction: ShippingInstruction,
  concepts: ShippingInstructionConcept[] = instruction.concepts || [],
  baseUrl?: string
): string {
  // Build absolute logo URL so it resolves correctly inside print iframes
  const logoUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/ingelox-logo.png`
    : (typeof window !== 'undefined' ? `${window.location.origin}/ingelox-logo.png` : '/ingelox-logo.png');
  const conceptRows = concepts.length > 0 ? concepts.map((c) => {
    let formaPago = c.forma_pago || '';
    if (formaPago === 'CONTADO') formaPago = 'Prepaid';
    if (formaPago === 'CREDITO') formaPago = 'Collect';
    if (formaPago === 'CONSIGNACION') formaPago = 'N/A';
    return `
    <tr>
      <td style="font-weight:bold; font-size:10pt; background:#FFE598;">${esc(c.concepto)}</td>
      <td colspan="2" style="font-size:11pt;">${esc(c.proveedor)}</td>
      <td colspan="2" style="font-size:11pt;">${esc(formaPago)}</td>
      <td colspan="2" style="font-size:11pt;">${esc(formatMoney(c.costo, c.moneda_costo || 'USD'))}</td>
      <td style="font-size:10pt;">${esc(formatMoney(c.venta, c.moneda_venta || 'USD'))}</td>
      <td style="font-size:11pt;">${esc(c.facturar_a)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="9" style="text-align:center; color:#888;">Sin conceptos de operaciones registrados</td></tr>`;

  // Exact column proportions matching the original template (C to K)
  // Sum: 16.86+12.82+5.92+5.92+16.17+9.76+6.21+11.34+15.00 = 100.00%
  const colgroupMaster = `
  <colgroup>
    <col style="width: 16.86%;"> <!-- C -->
    <col style="width: 12.82%;"> <!-- D -->
    <col style="width: 5.92%;">  <!-- E -->
    <col style="width: 5.92%;">  <!-- F -->
    <col style="width: 16.17%;"> <!-- G -->
    <col style="width: 9.76%;">  <!-- H -->
    <col style="width: 6.21%;">  <!-- I -->
    <col style="width: 11.34%;"> <!-- J -->
    <col style="width: 15.00%;"> <!-- K -->
  </colgroup>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Instrucciones de Embarque — ${esc(instruction.do_number)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: Calibri, 'Nunito Sans', Arial, sans-serif;
    font-size: 11pt;
    color: #000000;
    background: #FFFFFF;
    padding: 10mm 12mm;
  }

  table.excel-grid {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 0;
    overflow: hidden;
  }

  table.excel-grid td, table.excel-grid th {
    border: 1px solid #000000;
    padding: 1px 3px;
    height: 15.75pt;
    vertical-align: middle;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.15;
  }

  /* Avoid line breaks in key headers */
  table.excel-grid th {
    white-space: nowrap;
  }

  /* Centering exceptions */
  table.excel-grid th.sec-title, table.excel-grid td.sec-title {
    text-align: center;
    font-weight: bold;
    letter-spacing: 0.3px;
  }

  table.excel-grid td.lbl {
    font-weight: bold;
    white-space: nowrap;
  }

  table.excel-grid td.no-border {
    border: none !important;
    background: transparent !important;
  }

  /* Blue background for General Data labels */
  .bg-light-blue {
    background: #D9E1F2 !important;
  }

  /* Print configuration */
  @media print {
    body { padding: 0; }
    @page { size: letter landscape; margin: 19mm 6mm; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    thead { display: table-header-group; }
  }
</style>
</head>
<body>

<!-- TABLE 1: GENERAL DATA AND SHIPPING INFORMATION -->
<table class="excel-grid">
  ${colgroupMaster}
  <tbody>
    <!-- ROW 2: MAIN TITLE -->
    <tr>
      <td colspan="9" class="sec-title" style="height: 57.75pt; font-family: 'Arial Black', Arial, sans-serif; font-size: 22pt; position: relative; overflow: hidden;">
        INSTRUCCIONES DE EMBARQUE
        <img src="${logoUrl}" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); height: 45px; object-fit: contain;" onerror="this.style.display='none'" />
      </td>
    </tr>

    <!-- SPACER AFTER MAIN TITLE -->
    <tr><td colspan="9" class="no-border" style="height: 10pt;"></td></tr>

    <!-- GENERAL DATA -->
    <tr>
      <td class="lbl bg-light-blue" style="font-size:10pt;">FECHA CREACIÓN</td>
      <td colspan="2" style="font-size:10pt;">${esc(instruction.fecha_creacion)}</td>
      <td class="no-border" colspan="6"></td>
    </tr>
    <tr>
      <td class="lbl bg-light-blue" style="font-size:10pt;">DO</td>
      <td colspan="2" style="font-size:10pt;">${esc(instruction.do_number)}</td>
      <td class="no-border" colspan="6"></td>
    </tr>
    <tr>
      <td class="lbl bg-light-blue" style="font-size:10pt;">COMERCIAL</td>
      <td colspan="2" style="font-size:10pt;">${esc(instruction.comercial)}</td>
      <td class="no-border" colspan="2"></td>
      <td class="lbl bg-light-blue" colspan="2" style="font-size:10pt;"># OFERTA</td>
      <td style="font-size:10pt;">${esc(instruction.oferta)}</td>
      <td class="no-border"></td>
    </tr>
    <tr>
      <td class="lbl bg-light-blue" style="font-size:10pt;">CLIENTE</td>
      <td colspan="2" style="font-size:10pt;">${esc(instruction.cliente)}</td>
      <td class="no-border" colspan="2"></td>
      <td class="lbl bg-light-blue" colspan="2" style="font-size:10pt;">CRÉDITO</td>
      <td style="font-size:10pt;">${esc(instruction.credito)}</td>
      <td class="no-border"></td>
    </tr>
    <tr>
      <td class="lbl bg-light-blue" style="font-size:10pt;">CONTACTO</td>
      <td colspan="2" style="font-size:10pt;">${esc(instruction.contacto)}</td>
      <td class="no-border" colspan="6"></td>
    </tr>
    <tr>
      <td class="lbl bg-light-blue" style="font-size:10pt;">TELÉFONO</td>
      <td colspan="2" style="font-size:10pt;">${esc(instruction.telefono)}</td>
      <td class="no-border" colspan="6"></td>
    </tr>
    <tr>
      <td class="lbl bg-light-blue" style="font-size:10pt;">CORREO</td>
      <td colspan="2" style="font-size:10pt;">${esc(instruction.correo)}</td>
      <td class="no-border" colspan="6"></td>
    </tr>

    <!-- SPACE -->
    <tr><td colspan="9" class="no-border" style="height: 15.75pt;"></td></tr>

    <!-- SHIPPING INFORMATION TITLE -->
    <tr>
      <td class="no-border"></td>
      <td colspan="7" class="sec-title" style="background:#F7CAAC; font-size:12pt;">INFORMACIÓN EMBARQUE</td>
      <td class="no-border"></td>
    </tr>

    <!-- SPACER AFTER SHIPPING INFO TITLE -->
    <tr><td colspan="9" class="no-border" style="height: 10pt;"></td></tr>

    <!-- SHIPPING INFORMATION DATA -->
    <tr>
      <td class="lbl" style="background:#F7CAAC; font-size:11pt; white-space: nowrap;">INCOTERM</td>
      <td colspan="2" style="font-size:11pt;">${esc(instruction.incoterm)}</td>
      <td class="no-border" colspan="6"></td>
    </tr>
    <tr>
      <td class="lbl" style="background:#F7CAAC; font-size:11pt; white-space: nowrap;">TIPO DE EMBARQUE</td>
      <td colspan="2" style="font-size:11pt;">${esc(instruction.tipo_de_embarque)}</td>
      <td class="no-border" colspan="2"></td>
      <td class="lbl" colspan="2" style="background:#F7CAAC; font-size:11pt; white-space: nowrap;">COMPLEMENTO</td>
      <td colspan="2" style="font-size:10pt;">${esc(instruction.complemento)}</td>
    </tr>
    <tr>
      <td class="lbl" style="background:#F7CAAC; font-size:11pt; white-space: nowrap;">RUTA</td>
      <td colspan="2" style="font-size:11pt;">${esc(instruction.ruta)}</td>
      <td class="no-border" colspan="2"></td>
      <td class="lbl" colspan="2" style="background:#F7CAAC; font-size:11pt; white-space: nowrap;">VÍA</td>
      <td colspan="2" style="font-size:10pt;">${esc(instruction.via)}</td>
    </tr>
    <tr>
      <td class="lbl" style="background:#F7CAAC; font-size:11pt; white-space: nowrap;">MODALIDAD</td>
      <td colspan="2" style="font-size:11pt;">${esc(instruction.modalidad)}</td>
      <td class="no-border" colspan="6"></td>
    </tr>

    <!-- SPACE -->
    <tr><td colspan="9" class="no-border" style="height: 15.75pt;"></td></tr>

    <!-- OPERATIONS INSTRUCTIONS TITLE -->
    <tr>
      <td class="no-border"></td>
      <td colspan="7" class="sec-title" style="background:#D6DCE4; font-size:12pt;">INSTRUCCIONES OPERACIONES</td>
      <td class="no-border"></td>
    </tr>

    <!-- SPACER AFTER OPERATIONS TITLE -->
    <tr><td colspan="9" class="no-border" style="height: 10pt;"></td></tr>
  </tbody>
</table>

<!-- TABLE 2: CONCEPTS (With THEAD to repeat headers on pagination) -->
<table class="excel-grid">
  ${colgroupMaster}
  <thead>
    <!-- CONCEPT HEADERS (Centered, background #D6DCE4) -->
    <tr>
      <th class="sec-title" style="background:#D6DCE4; font-size:11pt;">CONCEPTO VENDIDO</th>
      <th class="sec-title" colspan="2" style="background:#D6DCE4; font-size:11pt;">PROVEEDOR</th>
      <th class="sec-title" colspan="2" style="background:#D6DCE4; font-size:11pt;">FORMA DE PAGO</th>
      <th class="sec-title" colspan="2" style="background:#D6DCE4; font-size:11pt;">COSTO</th>
      <th class="sec-title" style="background:#D6DCE4; font-size:11pt;">VENTA</th>
      <th class="sec-title" style="background:#D6DCE4; font-size:11pt;">FACTURAR A</th>
    </tr>
  </thead>
  <tbody>
    <!-- CONCEPT ROWS -->
    ${conceptRows}
  </tbody>
</table>

<!-- TABLE 3: OBSERVATIONS -->
<table class="excel-grid">
  ${colgroupMaster}
  <tbody>
    <!-- SPACE -->
    <tr><td colspan="9" class="no-border" style="height: 15.75pt;"></td></tr>

    <!-- ADDITIONAL OBSERVATIONS TITLE -->
    <tr>
      <td colspan="9" class="sec-title" style="background:#D0CECE; font-size:12pt;">OBSERVACIONES ADICIONALES</td>
    </tr>
    <!-- OBSERVATIONS BODY -->
    <tr>
      <td colspan="9" style="font-weight:bold; font-size:12pt; vertical-align: top; white-space: pre-wrap; height: auto; min-height: 50pt;">${esc(instruction.comentarios) || ''}</td>
    </tr>
  </tbody>
</table>

</body>
</html>`;
}
