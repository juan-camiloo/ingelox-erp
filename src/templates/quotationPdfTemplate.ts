import type { Quotation } from '../types/commercial';

function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNum(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildQuotationHtml(quotation: Quotation): string {
  const itemsRows = quotation.items.map((it) => {
    const itemCurrency = it.moneda || quotation.moneda || 'USD';
    return `
    <tr>
      <td style="text-align:center; padding: 4px 6px; border: 1px solid #000000; font-size: 8.5pt;">${it.cantidad}</td>
      <td style="text-align:left; padding: 4px 8px; border: 1px solid #000000; font-size: 8.5pt; font-weight: bold;">
        <span style="display:inline-block; font-size: 7pt; font-weight: bold; background: #E2E8F0; padding: 1px 4px; border-radius: 3px; margin-right: 5px; border: 1px solid #CBD5E1;">${esc(itemCurrency)}</span>
        ${esc(it.concepto)}
      </td>
      <td style="text-align:right; padding: 4px 6px; border: 1px solid #000000; font-size: 8.5pt;">${formatNum(it.valor_unitario)}</td>
      <td style="text-align:center; padding: 4px 6px; border: 1px solid #000000; font-size: 8.5pt;">${it.porcentaje_descuento || 0}%</td>
      <td style="text-align:right; padding: 4px 6px; border: 1px solid #000000; font-size: 8.5pt;">${formatNum(it.subtotal)}</td>
      <td style="text-align:right; padding: 4px 6px; border: 1px solid #000000; font-size: 8.5pt;">${formatNum(it.iva)}</td>
      <td style="text-align:right; padding: 4px 6px; border: 1px solid #000000; font-size: 8.5pt; font-weight: bold;">${formatNum(it.total)}</td>
    </tr>
  `;
  }).join('');

  const trmBadges: string[] = [];
  if (quotation.trm_usd && quotation.trm_usd > 0) {
    trmBadges.push(`TRM USD: <strong>$ ${formatNum(quotation.trm_usd)} COP</strong>`);
  }
  if (quotation.trm_eur && quotation.trm_eur > 0) {
    trmBadges.push(`TRM EUR: <strong>$ ${formatNum(quotation.trm_eur)} COP</strong>`);
  }
  const trmBannerHtml = trmBadges.length > 0 ? `
    <div style="margin-top: 8px; margin-bottom: 10px; padding: 6px 10px; background: #F8FAFC; border: 1px solid #CBD5E1; font-size: 8pt; border-radius: 4px;">
      <span style="font-weight: bold; text-transform: uppercase;">Tasas de Cambio Oficiales (TRM base COP = 1):</span> &nbsp;&nbsp; ${trmBadges.join(' &nbsp;&nbsp;|&nbsp;&nbsp; ')}
    </div>
  ` : '';

  const normalizedEntries = quotation.totales_normalizados
    ? Object.entries(quotation.totales_normalizados)
    : [];

  let totalRowsHtml = '';
  if (normalizedEntries.length > 0) {
    totalRowsHtml = normalizedEntries.map(([currency, tn]) => `
      <tr class="total-row">
        <td colspan="4" style="text-align: right; padding-right: 10px; font-weight: bold; font-size: 8pt;">
          TOTAL NORMALIZADO (${esc(currency)})${tn.trm && currency !== 'COP' ? ` &nbsp;<span style="font-size: 7.5pt; font-weight: normal; color: #555;">[TRM: $${formatNum(tn.trm)}]</span>` : ''}
        </td>
        <td style="text-align: right; font-size: 8.5pt;">${formatNum(tn.subtotal)}</td>
        <td style="text-align: right; font-size: 8.5pt;">${formatNum(tn.total_iva)}</td>
        <td style="text-align: right; font-weight: bold; background: #F4F4F4; font-size: 8.5pt;">${formatNum(tn.total)} ${esc(currency)}</td>
      </tr>
    `).join('');
  } else {
    totalRowsHtml = `
      <tr class="total-row">
        <td colspan="4" style="text-align: right; padding-right: 10px; font-weight: bold;">TOTAL (${esc(quotation.moneda || 'USD')})</td>
        <td style="text-align: right;">${formatNum(quotation.subtotal)}</td>
        <td style="text-align: right;">${formatNum(quotation.total_iva)}</td>
        <td style="text-align: right; font-weight: bold; background: #F4F4F4;">${formatNum(quotation.total)} ${esc(quotation.moneda || 'USD')}</td>
      </tr>
    `;
  }

  const now = new Date();
  const printTimeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const defaultConditions = [
    '1. Las anteriores tarifas están sujetas a IVA, Cuota por kilo, variaciones en BAF o FS, recargos por GRI o Peak Season.',
    '2. Nuestras tarifas están basadas en las condiciones actuales del mercado y están sujetas a cambio sin previo aviso.',
    '3. No se incluyen cargues, descargues, bodegajes, stand by, inspecciones u otros conceptos que serán facturados en caso de ser necesario.',
    '4. Los itinerarios y tiempos de tránsito son estimados y de exclusiva responsabilidad de los transportadores contratados.',
    '5. Esta oferta está sujeta a las cláusulas y condiciones descritas en los documentos de transporte.',
    '6. El uso de nuestros servicios confirma la aceptación de esta oferta comercial y nos autoriza para contratar en su nombre los servicios requeridos para la prestación del servicio, con empresas autorizadas por los entes reguladores nacionales e internacionales.',
    '7. A los clientes sin crédito se solicitará anticipo del 100% del total de la oferta.',
    '8. El pago de la factura deberá efectuarse en pesos colombianos a la tasa TRM del día de pago + $50 pesos, siempre y cuando esta no sea inferior a la tasa de referencia incluida en nuestra factura.',
    '9. La póliza de seguro que ofrecemos es específica para el embarque cotizado y debemos contar con la factura comercial para su emisión. Cobertura Puerta a Puerta. Límite máximo COP $150.000.000. Lucro cesante 10%. Deducible 10% con mínimo 2.5 S.M.M.L.V. (Avería general común o gruesa y cobertura de gastos, no aplica deducible). Se aplican las cláusulas de carga del Instituto (A) (TODO RIESGO) condicionado general 10/05/2018 / CL P. 10. HDC/Gle000000008.0001 (Cláusula A del Instituto de Londres).'
  ];

  const conditionsToRender = quotation.condiciones?.length ? quotation.condiciones : defaultConditions;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Cotización ${esc(quotation.consecutivo)} — INGELOX</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, 'Roboto', Helvetica, sans-serif;
    color: #000000;
    background: #FFFFFF;
    font-size: 8.5pt;
    line-height: 1.25;
    padding: 10mm 12mm;
  }

  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }
  .header-table td {
    vertical-align: top;
  }

  .company-box {
    font-size: 8pt;
    line-height: 1.35;
  }
  .company-box strong {
    font-size: 8.5pt;
  }

  .quote-box {
    border: 1.5px solid #000000;
    padding: 6px 10px;
    font-size: 7.5pt;
    line-height: 1.4;
  }
  .quote-box .quote-num {
    font-size: 11pt;
    font-weight: bold;
    margin-bottom: 4px;
    border-bottom: 1px solid #000000;
    padding-bottom: 2px;
  }

  .greeting {
    margin: 10px 0;
    font-size: 8pt;
    line-height: 1.35;
  }

  table.data-grid {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    margin-bottom: 12px;
  }
  table.data-grid th {
    background: #FFFFFF;
    border: 1.5px solid #000000;
    padding: 4px 6px;
    font-size: 8pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
  }
  table.data-grid td {
    border: 1px solid #000000;
    padding: 4px 6px;
    font-size: 8pt;
  }
  table.data-grid tr.total-row td {
    font-weight: bold;
    border: 1.5px solid #000000;
    background: #FFFFFF;
  }

  .section-label {
    font-weight: bold;
    font-size: 8pt;
    text-transform: uppercase;
    margin-bottom: 3px;
  }

  .observations-box {
    margin-bottom: 12px;
    font-size: 8pt;
    line-height: 1.3;
    padding: 4px 6px;
    border: 1px solid #999999;
    background: #FAFAFA;
  }

  .conditions-box {
    font-size: 6.5pt;
    line-height: 1.3;
    color: #222222;
    margin-bottom: 20px;
  }
  .conditions-box ol {
    padding-left: 14px;
  }
  .conditions-box li {
    margin-bottom: 2px;
  }

  .footer-sig {
    text-align: center;
    font-weight: bold;
    font-size: 8pt;
    margin-top: 24px;
    margin-bottom: 12px;
  }

  .page-bottom {
    display: flex;
    justify-content: space-between;
    font-size: 7pt;
    border-top: 1px solid #CCCCCC;
    padding-top: 4px;
    color: #444444;
  }

  @media print {
    body { padding: 0; }
    @page { size: letter portrait; margin: 10mm 10mm; }
  }
</style>
</head>
<body>

  <!-- CABECERA -->
  <table class="header-table">
    <tr>
      <td style="width: 50%;">
        <div style="margin-bottom: 6px;">
          <img src="/ingelox-logo.png" alt="INGELOX" style="height: 48px; object-fit: contain;" onerror="this.style.display='none'" />
        </div>
        <div class="company-box">
          <strong>INGELOX SAS</strong><br>
          NIT: 900.528.917-1<br>
          DIRECCIÓN: CALLE 25B # 74-08<br>
          CIUDAD: BOGOTA, D.C.<br>
          TEL: 4850855
        </div>
      </td>
      <td style="width: 50%;">
        <div class="quote-box">
          <div class="quote-num">COTIZACIÓN No. ${esc(quotation.consecutivo)}</div>
          <div><strong>FECHA:</strong> ${esc(quotation.fecha)}</div>
          <div><strong>VALIDEZ:</strong> ${esc(quotation.validez)}</div>
          <div><strong>FORMA DE PAGO:</strong> ${esc(quotation.forma_pago)}</div>
          <div><strong>VENDEDOR:</strong> ${esc(quotation.vendedor)}</div>
          <div style="border-top: 1px solid #E0E0E0; margin-top: 3px; padding-top: 3px;">
            <div><strong>ATENCIÓN:</strong> ${esc(quotation.atencion || '--')}</div>
            <div><strong>CLIENTE:</strong> ${esc(quotation.cliente_nombre)}</div>
            <div><strong>NIT:</strong> ${esc(quotation.cliente_nit)}</div>
            <div><strong>DIRECCIÓN:</strong> ${esc(quotation.cliente_direccion || '--')}</div>
            <div><strong>TELÉFONO:</strong> ${esc(quotation.cliente_telefono || '--')}</div>
          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- SALUDO -->
  <div class="greeting">
    <strong>Estimado cliente</strong><br>
    Atendiendo su amable solicitud, nos permitimos enviar propuesta comercial de acuerdo a sus necesidades y datos informados. Esperamos atentos sus comentarios e instrucciones. ¡Es un gusto poder servirle!
  </div>

  ${trmBannerHtml}

  <!-- TABLA DE CONCEPTOS -->
  <table class="data-grid">
    <thead>
      <tr>
        <th style="width: 6%;">CANT</th>
        <th style="width: 44%;">CONCEPTO</th>
        <th style="width: 10%;">VR. UNIT.</th>
        <th style="width: 8%;">% DTO.</th>
        <th style="width: 10%;">SUBTOTAL</th>
        <th style="width: 10%;">IVA</th>
        <th style="width: 12%;">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
      ${totalRowsHtml}
    </tbody>
  </table>

  <!-- OBSERVACIONES -->
  <div class="section-label">OBSERVACIONES</div>
  <div class="observations-box">
    ${esc(quotation.observaciones || 'Sin observaciones registradas.')}
  </div>

  <!-- NOTAS Y CONDICIONES LEGALES -->
  <div class="section-label">NOTAS / CONDICIONES</div>
  <div class="conditions-box">
    <ol>
      ${conditionsToRender.map((c) => `<li>${esc(c)}</li>`).join('')}
    </ol>
  </div>

  <!-- FIRMA -->
  <div class="footer-sig">
    Dpto Comercial
  </div>

  <!-- PIE DE PÁGINA -->
  <div class="page-bottom">
    <span>PÁGINA 1/1</span>
    <span>INGELOX LOGISTICS / ELABORADO ${printTimeStr}</span>
  </div>

</body>
</html>`;
}
