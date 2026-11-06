import type { AirWaybill, HouseAwb } from '../types/awb';
import { AWB_COPY_OPTIONS } from '../types/awb';

function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSingleAwbPage(
  awb: AirWaybill,
  targetHawb: HouseAwb | null | undefined,
  copyLabel: string
): string {
  const isHawb = !!targetHawb;

  const shipperName = isHawb ? targetHawb.shipper_name : awb.shipper_name;
  const shipperNit = isHawb ? targetHawb.shipper_nit : awb.shipper_nit;
  const shipperAddr = isHawb ? targetHawb.shipper_address : awb.shipper_address;
  const shipperPhone = isHawb ? targetHawb.shipper_phone : awb.shipper_phone;
  const shipperCity = isHawb ? targetHawb.shipper_city_country : awb.shipper_city_country;
  const shipperEmail = isHawb ? targetHawb.shipper_email : awb.shipper_email;

  const consigneeName = isHawb ? targetHawb.consignee_name : awb.consignee_name;
  const consigneeTaxId = isHawb ? targetHawb.consignee_tax_id : awb.consignee_tax_id;
  const consigneeAddr = isHawb ? targetHawb.consignee_address : awb.consignee_address;
  const consigneePhone = isHawb ? targetHawb.consignee_phone : awb.consignee_phone;
  const consigneeCity = isHawb ? targetHawb.consignee_city_country : awb.consignee_city_country;

  const pieces = isHawb ? targetHawb.pieces : awb.cargo.pieces;
  const grossW = isHawb ? targetHawb.gross_weight : awb.cargo.gross_weight;
  const chgW = isHawb ? targetHawb.chargeable_weight : awb.cargo.chargeable_weight;
  const unit = isHawb ? targetHawb.weight_unit : (awb.cargo.weight_unit || 'k');
  const rateDisplay = isHawb ? targetHawb.rate_charge_display : awb.cargo.rate_charge_display;
  const totalDisplay = isHawb ? targetHawb.total_charge_display : awb.cargo.total_charge_display;
  const natureGoods = isHawb ? targetHawb.nature_and_quantity : awb.cargo.nature_and_quantity;
  const handling = isHawb ? targetHawb.handling_information : (awb.handling_information || 'ATTACHED DOCUMENTS');
  const otherCharges1 = isHawb ? targetHawb.other_charges_line1 : awb.other_charges_line1;

  const isAgreed = !isHawb && awb.cargo.rate_charge_type === 'as_agreed';
  const isPpd = awb.wt_val_payment === 'PPD';

  const weightChargePrepaid = isHawb
    ? (targetHawb.weight_charge_display || 'AS AGREED')
    : (isAgreed ? 'AS AGREED' : (isPpd ? totalDisplay : '-'));

  const weightChargeCollect = isHawb
    ? '-'
    : (isAgreed ? '-' : (!isPpd ? totalDisplay : '-'));

  const totalPrepaidStr = isHawb
    ? (targetHawb.total_charges_display || 'AS AGREED')
    : (isAgreed ? 'AS AGREED' : `USD ${Number(awb.total_prepaid || 0).toFixed(2)}`);

  const totalCollectStr = isHawb
    ? '-'
    : (awb.total_collect && Number(awb.total_collect) > 0 ? `USD ${Number(awb.total_collect).toFixed(2)}` : '-');

  const docNo = isHawb ? `HAWB-${targetHawb.hawb_number}` : awb.full_awb_number;
  const airlinePrefix = awb.airline_code ? `${awb.airline_code} - ${awb.origin_airport_code}` : awb.origin_airport_code;

  return `
    <div class="awb-page-wrapper">
      <div class="awb-page">
        <!-- 1. TOP HEADER ROW -->
        <div class="row row-hdr">
          <div class="cell" style="width: 25%; display: flex; padding: 0;">
            <div style="flex: 1; border-right: 1px solid #000; padding: 2.5px 4px;">
              <div class="lbl">AIRLINE CODE / PREFIX</div>
              <div class="val-mono" style="font-size: 9.5pt; margin-top: 2px;">${esc(airlinePrefix)}</div>
            </div>
            <div style="flex: 1; padding: 2.5px 4px;">
              <div class="lbl">AWB NUMBER</div>
              <div class="val-mono" style="font-size: 9.5pt; margin-top: 2px;">${esc(awb.awb_number)}</div>
            </div>
          </div>
          <div class="cell" style="width: 48%; text-align: center; vertical-align: middle; padding: 3px 4px;">
            <div style="font-size: 11pt; font-weight: bold; letter-spacing: 0.5px;">NOT NEGOTIABLE</div>
            <div style="font-size: 8.5pt; font-weight: bold; color: #111;">${isHawb ? 'HOUSE AIR WAYBILL' : 'AIR WAYBILL'}</div>
          </div>
          <div class="cell" style="width: 27%; text-align: right; padding: 2.5px 5px;">
            <div class="lbl" style="text-align: right;">DOCUMENT NO.</div>
            <div class="val-mono" style="font-size: 11pt; font-weight: bold; margin-top: 2px;">${esc(docNo)}</div>
          </div>
        </div>

        <!-- 2. SHIPPER & ISSUED BY -->
        <div class="row" style="min-height: 24mm;">
          <div class="cell" style="width: 50%;">
            <div class="lbl">SHIPPER'S NAME AND ADDRESS</div>
            <div class="val-bold" style="font-size: 8.5pt;">${esc(shipperName)}</div>
            <div class="val">NIT / Tax ID: ${esc(shipperNit || '')}</div>
            <div class="val">${esc(shipperAddr || '')} ${esc(shipperCity || '')}</div>
            <div class="val">Tel: ${esc(shipperPhone || '')}${shipperEmail ? ' | Email: ' + esc(shipperEmail) : ''}</div>
          </div>
          <div class="cell" style="width: 50%; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="lbl">ISSUED BY (AIRLINE / CARRIER)</div>
              <div class="val-bold" style="font-size: 9.5pt; margin-top: 1px;">${esc(awb.airline_name)}</div>
            </div>
            <div style="font-size: 6pt; color: #333; line-height: 1.2; margin-top: 4px;">
              Copies 1, 2 and 3 of this Air Waybill are originals and have the same validity.<br>
              Subject to conditions of contract on the reverse hereof.
            </div>
          </div>
        </div>

        <!-- 3. CONSIGNEE & AGENT -->
        <div class="row" style="min-height: 24mm;">
          <div class="cell" style="width: 50%;">
            <div class="lbl">CONSIGNEE'S NAME AND ADDRESS</div>
            <div class="val-bold" style="font-size: 8.5pt;">${esc(consigneeName)}</div>
            <div class="val">RFC / Tax ID: ${esc(consigneeTaxId || '')}</div>
            <div class="val">${esc(consigneeAddr || '')} ${esc(consigneeCity || '')}</div>
            <div class="val">Tel: ${esc(consigneePhone || '')}</div>
          </div>
          <div class="cell" style="width: 50%;">
            <div class="lbl">ISSUING CARRIER'S AGENT NAME AND CITY</div>
            <div class="val-bold" style="font-size: 8.5pt;">${esc(awb.agent_name || 'INGELOX S.A.S.')}</div>
            <div class="val">NIT: ${esc(awb.agent_nit || '900.526.917-1')} • ${esc(awb.agent_city_country || 'Bogotá, Colombia')}</div>
            <div class="val" style="margin-top: 2px;">IATA Cargo Agent Code: <strong>${esc(awb.agent_iata_code || '76-1 0215/0003')}</strong></div>
          </div>
        </div>

        <!-- 4. AIRPORT OF DEPARTURE & ACCOUNTING & REFERENCE -->
        <div class="row" style="min-height: 11mm;">
          <div class="cell" style="width: 44%;">
            <div class="lbl">AIRPORT OF DEPARTURE (ADDR. OF FIRST CARRIER) AND REQUESTED ROUTING</div>
            <div class="val-bold">${esc(awb.origin_city)} (${esc(awb.origin_airport_code)})</div>
          </div>
          <div class="cell" style="width: 18%;">
            <div class="lbl">ACCOUNTING INFORMATION</div>
            <div class="val-bold" style="font-size: 7pt;">${esc(awb.accounting_information || (awb.trm ? `TRM ${awb.trm}` : ''))}</div>
          </div>
          <div class="cell" style="width: 38%;">
            <div class="lbl">REFERENCE NUMBER / OPTIONAL SHIPPING INFO</div>
            <div class="val-bold">${awb.do_number ? 'REF: ' + esc(awb.do_number) : ''}</div>
          </div>
        </div>

        <!-- 5. ROUTING & PAYMENT CODE -->
        <div class="row" style="min-height: 11mm;">
          <div class="cell" style="width: 7%; text-align: center;">
            <div class="lbl">TO</div>
            <div class="val-mono bold">${esc(awb.dest_airport_code)}</div>
          </div>
          <div class="cell" style="width: 23%;">
            <div class="lbl">BY FIRST CARRIER</div>
            <div class="val-bold" style="font-size: 7.5pt;">${esc(awb.first_carrier_acronym || awb.airline_name)}</div>
          </div>
          <div class="cell" style="width: 6%; text-align: center;">
            <div class="lbl">TO</div>
            <div class="val-mono">${esc(awb.to_2nd || '-')}</div>
          </div>
          <div class="cell" style="width: 10%; text-align: center;">
            <div class="lbl">BY</div>
            <div class="val-mono">${esc(awb.by_2nd || '-')}</div>
          </div>
          <div class="cell" style="width: 8%; text-align: center;">
            <div class="lbl">CURRENCY</div>
            <div class="val-mono bold">${esc(awb.currency || 'USD')}</div>
          </div>
          <div class="cell" style="width: 6%; text-align: center;">
            <div class="lbl">CHGS</div>
            <div class="val-mono">${esc(awb.chgs_code || '')}</div>
          </div>
          <div class="cell" style="width: 20%; text-align: center;">
            <div class="lbl">WT / VAL</div>
            <div class="val bold" style="font-size: 6.8pt; margin-top: 1px;">
              PPD [${awb.wt_val_payment === 'PPD' ? 'X' : ' '}] &nbsp;&nbsp; COLL [${awb.wt_val_payment === 'COLL' ? 'X' : ' '}]
            </div>
          </div>
          <div class="cell" style="width: 20%; text-align: center;">
            <div class="lbl">OTHER</div>
            <div class="val bold" style="font-size: 6.8pt; margin-top: 1px;">
              PPD [${awb.other_payment === 'PPD' ? 'X' : ' '}] &nbsp;&nbsp; COLL [${awb.other_payment === 'COLL' ? 'X' : ' '}]
            </div>
          </div>
        </div>

        <!-- 6. AIRPORT OF DESTINATION & FLIGHT & VALUES -->
        <div class="row" style="min-height: 11mm;">
          <div class="cell" style="width: 34%;">
            <div class="lbl">AIRPORT OF DESTINATION</div>
            <div class="val-bold">${esc(awb.dest_city)} (${esc(awb.dest_airport_code)})</div>
          </div>
          <div class="cell" style="width: 26%;">
            <div class="lbl">FLIGHT / DATE</div>
            <div class="val-mono bold">${esc(awb.flight_number)} &nbsp;&nbsp; ${esc(awb.flight_date || '')}</div>
          </div>
          <div class="cell" style="width: 20%; text-align: center;">
            <div class="lbl">DECLARED VALUE FOR CARRIAGE</div>
            <div class="val-mono bold">${esc(awb.declared_value_carriage || 'N.V.D.')}</div>
          </div>
          <div class="cell" style="width: 20%; text-align: center;">
            <div class="lbl">DECLARED VALUE FOR CUSTOMS</div>
            <div class="val-mono bold">${esc(awb.declared_value_customs || 'N.C.V.')}</div>
          </div>
        </div>

        <!-- 7. HANDLING INFORMATION & INSURANCE -->
        <div class="row" style="min-height: 11mm;">
          <div class="cell" style="width: 78%;">
            <div class="lbl">HANDLING INFORMATION</div>
            <div class="val-bold" style="font-size: 7pt;">${esc(handling)}</div>
          </div>
          <div class="cell" style="width: 22%; text-align: center;">
            <div class="lbl">AMOUNT OF INSURANCE</div>
            <div class="val-mono bold">${esc(awb.amount_insurance || 'N. I. L.')}</div>
          </div>
        </div>

        <!-- 8. CARGO & RATING TABLE (DYNAMIC HEIGHT EXPANDING TO FILL PAGE) -->
        <div class="cargo-section">
          <table class="cargo-table">
            <thead>
              <tr>
                <th style="width: 7%;">No. of<br>Pieces RCP</th>
                <th style="width: 10%;">Gross<br>Weight</th>
                <th style="width: 5%;">Kg /<br>Lb</th>
                <th style="width: 6%;">Rate<br>Class</th>
                <th style="width: 8%;">Commodity<br>Item No.</th>
                <th style="width: 10%;">Chargeable<br>Weight</th>
                <th style="width: 9%;">Rate /<br>Charge</th>
                <th style="width: 12%;">Total<br>(Weight Charge)</th>
                <th style="width: 33%;">Nature and Quantity of Goods<br>(incl. Dimensions or Volume)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 8.5pt;">${esc(pieces)}</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 8.5pt;">${typeof grossW === 'number' ? grossW.toLocaleString('en-US', { minimumFractionDigits: 1 }) : esc(grossW)}</td>
                <td style="text-align: center; font-weight: bold; font-size: 8.5pt;">${esc(unit)}</td>
                <td style="text-align: center; font-weight: bold; font-size: 8.5pt;">${esc(awb.cargo.rate_class || 'Q')}</td>
                <td style="text-align: center; font-size: 8pt;">${esc(awb.cargo.commodity_item_no || '')}</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 8.5pt;">${typeof chgW === 'number' ? chgW.toLocaleString('en-US', { minimumFractionDigits: 1 }) : esc(chgW)}</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 8.5pt;">${esc(rateDisplay)}</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 8.5pt;">${esc(totalDisplay)}</td>
                <td style="white-space: pre-line; font-size: 7pt; line-height: 1.2; padding: 4px 6px;">${esc(natureGoods)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="cargo-total-row">
                <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 8.5pt;">${esc(pieces)}</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 8.5pt;">${typeof grossW === 'number' ? grossW.toLocaleString('en-US', { minimumFractionDigits: 1 }) : esc(grossW)}</td>
                <td style="text-align: center; font-weight: bold; font-size: 8.5pt;">${esc(unit)}</td>
                <td colspan="4" style="text-align: right; font-size: 7pt; font-weight: bold; padding-right: 6px;">TOTAL WEIGHT CHARGE:</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 8.5pt;">${esc(totalDisplay)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 9. OTHER CHARGES & PREPAID/COLLECT SUMMARY -->
        <div class="row" style="min-height: 36mm;">
          <!-- Left: Other charges & certification -->
          <div class="cell" style="width: 46%; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div class="lbl">OTHER CHARGES</div>
              <div class="val-bold" style="font-size: 7.5pt; margin-top: 2px;">
                ${esc(otherCharges1 || '')}<br>
                ${esc(awb.other_charges_line2 || '')}<br>
                ${esc(awb.other_charges_line3 || '')}
              </div>
            </div>
            <div style="font-size: 5.8pt; color: #444; line-height: 1.15; border-top: 1px dashed #bbb; padding-top: 3px; margin-top: 4px;">
              Shipper certifies that the particulars on the face hereof are correct and that insofar as any part of the consignment contains dangerous goods, such part is properly described by name and is in proper condition for carriage by air.
            </div>
          </div>

          <!-- Right: Two-column breakdown of charges -->
          <div class="cell" style="width: 54%; padding: 0;">
            <table style="width: 100%; height: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f4f4f4; border-bottom: 1px solid #000;">
                  <th style="width: 44%; text-align: left; font-size: 6pt; padding: 2px 4px; border-right: 1px solid #000;"></th>
                  <th style="width: 28%; text-align: center; font-size: 6pt; padding: 2px 4px; border-right: 1px solid #000;">PREPAID CHARGES</th>
                  <th style="width: 28%; text-align: center; font-size: 6pt; padding: 2px 4px;">COLLECT CHARGES</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="font-size: 6.5pt; padding: 2px 4px; border-right: 1px solid #000;">Weight Charge</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 2px 4px; border-right: 1px solid #000;">${esc(weightChargePrepaid)}</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 2px 4px;">${esc(weightChargeCollect)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="font-size: 6.5pt; padding: 2px 4px; border-right: 1px solid #000;">Valuation Charge</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 2px 4px; border-right: 1px solid #000;">${awb.valuation_charge_prepaid ? awb.valuation_charge_prepaid.toFixed(2) : '-'}</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 2px 4px;">${awb.valuation_charge_collect ? awb.valuation_charge_collect.toFixed(2) : '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="font-size: 6.5pt; padding: 2px 4px; border-right: 1px solid #000;">Tax</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 2px 4px; border-right: 1px solid #000;">${awb.tax_prepaid ? awb.tax_prepaid.toFixed(2) : '-'}</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 2px 4px;">${awb.tax_collect ? awb.tax_collect.toFixed(2) : '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="font-size: 6.5pt; padding: 2px 4px; border-right: 1px solid #000;">Total Other Charges Due Agent</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 2px 4px; border-right: 1px solid #000;">${awb.due_agent_prepaid ? awb.due_agent_prepaid.toFixed(2) : '-'}</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 2px 4px;">${awb.due_agent_collect ? awb.due_agent_collect.toFixed(2) : '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #000;">
                  <td style="font-size: 6.5pt; padding: 2px 4px; border-right: 1px solid #000;">Total Other Charges Due Carrier</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 2px 4px; border-right: 1px solid #000;">${awb.due_carrier_prepaid ? awb.due_carrier_prepaid.toFixed(2) : '-'}</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 2px 4px;">${awb.due_carrier_collect ? awb.due_carrier_collect.toFixed(2) : '-'}</td>
                </tr>
                <tr style="background: #f0f0f0; font-weight: bold;">
                  <td style="font-size: 6.8pt; padding: 3px 4px; border-right: 1px solid #000;">TOTAL CHARGES</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 3px 4px; border-right: 1px solid #000;">${esc(totalPrepaidStr)}</td>
                  <td style="font-family: monospace; font-size: 7.5pt; text-align: right; padding: 3px 4px;">${esc(totalCollectStr)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 10. SIGNATURES & EXECUTION -->
        <div class="row" style="min-height: 18mm;">
          <div class="cell" style="width: 46%; display: flex; flex-direction: column; justify-content: space-between;">
            <div class="lbl">SIGNATURE OF SHIPPER OR HIS AGENT</div>
            <div class="val-bold" style="margin-top: 6px;">${esc(shipperName)}</div>
          </div>
          <div class="cell" style="width: 27%;">
            <div class="lbl">EXECUTED ON (DATE)</div>
            <div class="val-bold" style="font-size: 8pt; margin-bottom: 3px;">${esc(awb.executed_date || '')}</div>
            <div class="lbl" style="margin-top: 2px;">SIGNATURE OF ISSUING CARRIER OR ITS AGENT</div>
            <div class="val-bold" style="font-size: 8pt;">${esc(awb.carrier_signature || 'INGELOX S.A.S.')}</div>
          </div>
          <div class="cell" style="width: 27%;">
            <div class="lbl">AT (PLACE)</div>
            <div class="val-bold" style="font-size: 8pt;">${esc(awb.executed_place || 'Bogota, Colombia')}</div>
          </div>
        </div>

        <!-- 11. COPY DESIGNATION BAR (FOOTER) -->
        <div class="copy-bar">
          ${esc(copyLabel)}
        </div>
      </div>
    </div>
  `;
}

export function buildAwbHtml(
  awb: AirWaybill,
  targetHawb?: HouseAwb | null,
  selectedCopy?: string
): string {
  const isHawb = !!targetHawb;
  const isAll = selectedCopy === 'all';

  const defaultCopy = 'ORIGINAL 3 (FOR SHIPPER)';
  const activeCopies = isAll
    ? (AWB_COPY_OPTIONS as readonly string[])
    : [selectedCopy || defaultCopy];

  const docTitle = isHawb
    ? `HOUSE AIR WAYBILL — HAWB-${targetHawb.hawb_number}${isAll ? ' (Juego Completo)' : ` - ${selectedCopy || defaultCopy}`}`
    : `AIR WAYBILL — ${awb.full_awb_number}${isAll ? ' (Juego Completo)' : ` - ${selectedCopy || defaultCopy}`}`;

  const pagesHtml = activeCopies
    .map((copy) => renderSingleAwbPage(awb, targetHawb, copy))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${esc(docTitle)}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 6mm 6mm 6mm 6mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 7.5pt;
      color: #000;
      line-height: 1.15;
    }
    .awb-page-wrapper {
      width: 100%;
      height: 265mm;
      max-height: 265mm;
      min-height: 265mm;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 0 auto;
    }
    .awb-page-wrapper:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .awb-page {
      width: 100%;
      height: 100%;
      border: 1.5px solid #000;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      background: #fff;
    }
    .row {
      display: flex;
      width: 100%;
      border-bottom: 1px solid #000;
      box-sizing: border-box;
    }
    .row-hdr {
      background: #fff;
      min-height: 12mm;
    }
    .cell {
      border-right: 1px solid #000;
      padding: 2.5px 4.5px;
      box-sizing: border-box;
      position: relative;
    }
    .cell:last-child {
      border-right: none;
    }
    .lbl {
      font-size: 5.8pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #111;
      display: block;
      margin-bottom: 1px;
      line-height: 1.1;
    }
    .val {
      font-size: 7.2pt;
      color: #000;
      word-break: break-word;
    }
    .val-bold {
      font-size: 7.8pt;
      font-weight: bold;
      color: #000;
      word-break: break-word;
    }
    .val-mono {
      font-family: "Courier New", Courier, monospace;
      font-size: 8pt;
      font-weight: bold;
      color: #000;
    }
    .bold { font-weight: bold; }
    
    /* CARGO SECTION - DYNAMIC EXPANSION */
    .cargo-section {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid #000;
      min-height: 60mm;
      box-sizing: border-box;
    }
    .cargo-table {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
    }
    .cargo-table th {
      border-right: 1px solid #000;
      border-bottom: 1px solid #000;
      font-size: 5.8pt;
      font-weight: bold;
      text-transform: uppercase;
      padding: 2px 3px;
      background: #f7f7f7;
      text-align: center;
      line-height: 1.1;
    }
    .cargo-table th:last-child {
      border-right: none;
    }
    .cargo-table td {
      border-right: 1px solid #000;
      padding: 3px 4px;
      vertical-align: top;
    }
    .cargo-table td:last-child {
      border-right: none;
    }
    .cargo-total-row td {
      border-top: 1px solid #000;
      background: #f7f7f7;
      font-weight: bold;
      padding: 2.5px 4px;
    }

    /* COPY BAR AT BOTTOM */
    .copy-bar {
      background: #fbfbfb;
      text-align: center;
      font-weight: bold;
      font-size: 8pt;
      letter-spacing: 1.5px;
      padding: 3.5px 0;
      border-top: 1px solid #000;
      text-transform: uppercase;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}
