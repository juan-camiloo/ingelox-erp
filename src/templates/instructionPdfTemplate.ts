import type { ShippingInstruction, ShippingInstructionConcept } from '../types/practiko';

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
  concepts: ShippingInstructionConcept[] = instruction.concepts || []
): string {
  const conceptRows = concepts.length > 0 ? concepts.map((c) => {
    let formaPago = c.forma_pago || '';
    if (formaPago === 'CONTADO') formaPago = 'Prepaid';
    if (formaPago === 'CREDITO') formaPago = 'Collect';
    if (formaPago === 'CONSIGNACION') formaPago = 'N/A';
    return `
    <tr>
      <td style="font-weight:bold; font-size:10pt; background:#FFE598; border:1px solid #000; padding:2px 4px;">${esc(c.concepto)}</td>
      <td colspan="2" style="font-size:10pt; border:1px solid #000; padding:2px 4px;">${esc(c.proveedor)}</td>
      <td colspan="2" style="font-size:10pt; border:1px solid #000; padding:2px 4px; text-align:center;">${esc(formaPago)}</td>
      <td colspan="2" style="font-size:10pt; border:1px solid #000; padding:2px 4px; text-align:right;">${esc(formatMoney(c.costo, c.moneda_costo || 'USD'))}</td>
      <td style="font-size:10pt; border:1px solid #000; padding:2px 4px; text-align:right;">${esc(formatMoney(c.venta, c.moneda_venta || 'USD'))}</td>
      <td style="font-size:10pt; border:1px solid #000; padding:2px 4px;">${esc(c.facturar_a)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="9" style="text-align:center; color:#888; border:1px solid #000; padding:10px;">Sin conceptos de operaciones registrados</td></tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Instrucciones de Embarque — ${esc(instruction.do_number)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Calibri, 'Nunito Sans', Arial, sans-serif;
    font-size: 10pt;
    color: #000000;
    background: #FFFFFF;
    padding: 8mm 10mm;
  }
  table.excel-grid {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 8px;
  }
  table.excel-grid td, table.excel-grid th {
    border: 1px solid #000000;
    padding: 3px 5px;
    vertical-align: middle;
    line-height: 1.2;
    overflow: hidden;
  }
  .bg-header {
    background: #0F172A;
    color: #FFFFFF;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .bg-subtle {
    background: #D9E1F2;
    font-weight: bold;
  }
  .bg-yellow-header {
    background: #FFE598;
    font-weight: bold;
    text-align: center;
  }
  .lbl {
    font-weight: bold;
    background: #F1F5F9;
  }
  @media print {
    body { padding: 0; }
    @page { size: letter landscape; margin: 10mm 10mm; }
  }
</style>
</head>
<body>

  <!-- ENCABEZADO SUPERIOR -->
  <table class="excel-grid">
    <colgroup>
      <col style="width: 20%;">
      <col style="width: 30%;">
      <col style="width: 20%;">
      <col style="width: 30%;">
    </colgroup>
    <tr>
      <td colspan="4" class="bg-header" style="font-size: 13pt; padding: 6px;">
        INGELOX LOGISTICS SAS — FORMATO DE INSTRUCCIONES DE EMBARQUE
      </td>
    </tr>
    <tr>
      <td class="lbl">FECHA:</td>
      <td>${esc(instruction.fecha_creacion)}</td>
      <td class="lbl">ESTADO:</td>
      <td style="font-weight: bold; text-transform: uppercase; color: ${instruction.estado === 'finalizada' ? '#059669' : '#D97706'};">
        ${esc(instruction.estado)}
      </td>
    </tr>
    <tr>
      <td class="lbl">NÚMERO DO:</td>
      <td style="font-weight: bold; font-size: 11pt; color: #F35815;">${esc(instruction.do_number)}</td>
      <td class="lbl"># OFERTA:</td>
      <td>${esc(instruction.oferta)}</td>
    </tr>
    <tr>
      <td class="lbl">ASESOR COMERCIAL:</td>
      <td>${esc(instruction.comercial)}</td>
      <td class="lbl">CRÉDITO:</td>
      <td>${esc(instruction.credito)}</td>
    </tr>
    <tr>
      <td class="lbl">CLIENTE:</td>
      <td style="font-weight: bold;">${esc(instruction.cliente)}</td>
      <td class="lbl">CONTACTO:</td>
      <td>${esc(instruction.contacto)}</td>
    </tr>
    <tr>
      <td class="lbl">TELÉFONO:</td>
      <td>${esc(instruction.telefono)}</td>
      <td class="lbl">CORREO:</td>
      <td>${esc(instruction.correo)}</td>
    </tr>
  </table>

  <!-- INFORMACIÓN DEL EMBARQUE -->
  <table class="excel-grid">
    <colgroup>
      <col style="width: 20%;">
      <col style="width: 30%;">
      <col style="width: 20%;">
      <col style="width: 30%;">
    </colgroup>
    <tr>
      <td colspan="4" class="bg-subtle" style="text-align: center; text-transform: uppercase;">
        DATOS DE LA OPERACIÓN Y TRANSPORTE
      </td>
    </tr>
    <tr>
      <td class="lbl">INCOTERM:</td>
      <td style="font-weight: bold;">${esc(instruction.incoterm)}</td>
      <td class="lbl">COMPLEMENTO:</td>
      <td>${esc(instruction.complemento)}</td>
    </tr>
    <tr>
      <td class="lbl">VÍA:</td>
      <td style="font-weight: bold;">${esc(instruction.via)}</td>
      <td class="lbl">MODALIDAD:</td>
      <td>${esc(instruction.modalidad)}</td>
    </tr>
    <tr>
      <td class="lbl">RUTA:</td>
      <td>${esc(instruction.ruta)}</td>
      <td class="lbl">TIPO DE EMBARQUE:</td>
      <td>${esc(instruction.tipo_de_embarque)}</td>
    </tr>
    <tr>
      <td class="lbl">FACTURAR A:</td>
      <td colspan="3">${esc(instruction.facturar_a)}</td>
    </tr>
  </table>

  <!-- TABLA DE CONCEPTOS OPERATIVOS -->
  <table class="excel-grid">
    <colgroup>
      <col style="width: 17%;">
      <col style="width: 13%;">
      <col style="width: 6%;">
      <col style="width: 6%;">
      <col style="width: 16%;">
      <col style="width: 10%;">
      <col style="width: 6%;">
      <col style="width: 11%;">
      <col style="width: 15%;">
    </colgroup>
    <thead>
      <tr>
        <th class="bg-yellow-header">CONCEPTO</th>
        <th colspan="2" class="bg-subtle" style="text-align:center;">PROVEEDOR</th>
        <th colspan="2" class="bg-subtle" style="text-align:center;">FORMA DE PAGO</th>
        <th colspan="2" class="bg-subtle" style="text-align:center;">COSTO</th>
        <th class="bg-subtle" style="text-align:center;">VENTA</th>
        <th class="bg-subtle" style="text-align:center;">FACTURAR A</th>
      </tr>
    </thead>
    <tbody>
      ${conceptRows}
    </tbody>
  </table>

  <!-- COMENTARIOS ADICIONALES -->
  <table class="excel-grid">
    <tr>
      <td class="bg-subtle" style="font-weight:bold;">OBSERVACIONES / INSTRUCCIONES ESPECIALES:</td>
    </tr>
    <tr>
      <td style="min-height: 40px; padding: 6px; font-size: 9.5pt; vertical-align: top;">
        ${esc(instruction.comentarios) || 'Sin observaciones registradas.'}
      </td>
    </tr>
  </table>

  <div style="margin-top: 10px; display:flex; justify-content:space-between; font-size: 7.5pt; color: #555;">
    <span>INGELOX LOGISTICS SAS — Torre de Control Operativo</span>
    <span>Documento de Instrucción de Embarque Oficial</span>
  </div>

</body>
</html>`;
}
