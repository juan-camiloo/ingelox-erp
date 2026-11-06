import { useState, useCallback } from 'react';
import ExcelJS from 'exceljs';
import type { AirWaybill } from '../types/awb';

function setCell(sheet: any, addr: string, val: any) {
  const target = sheet.getCell(addr);
  const master = target.master ? sheet.getCell(target.master.address) : target;
  master.value = val;
}

export function useAwbExcelGenerator() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportAwbToExcel = useCallback(async (awb: AirWaybill, selectedCopy?: string) => {
    setIsExporting(true);
    setExportError(null);

    try {
      // 1. Cargar la plantilla oficial desde public/plantilla-awb.xlsx
      const response = await fetch('/plantilla-awb.xlsx');
      if (!response.ok) {
        throw new Error('No se pudo cargar la plantilla');
      }
      const buffer = await response.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const h1 = workbook.getWorksheet('Hoja1');
      if (!h1) {
        throw new Error('La plantilla no contiene la Hoja1 de entrada de datos');
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 1. DATOS DE LA MAWB EN Hoja1
      // ─────────────────────────────────────────────────────────────────────────
      // Identificación
      setCell(h1, 'B4', awb.airline_code || '729');
      setCell(h1, 'B5', awb.origin_city || 'Bogotá - Colombia');
      setCell(h1, 'B6', awb.origin_airport_code || 'BOG');
      setCell(h1, 'B7', awb.awb_number || '');
      setCell(h1, 'B8', awb.airline_name || 'Tampa Cargo S.A.S');

      // Remitente (Shipper)
      setCell(h1, 'B10', awb.shipper_name || '');
      setCell(h1, 'B11', awb.shipper_nit || '');
      setCell(h1, 'B12', awb.shipper_address || '');
      setCell(h1, 'B13', awb.shipper_phone || '');
      setCell(h1, 'B14', awb.shipper_city_country || '');
      setCell(h1, 'B15', awb.shipper_email || '');
      setCell(h1, 'B16', awb.shipper_account_no || '');

      // Destinatario (Consignee)
      setCell(h1, 'B18', awb.consignee_name || '');
      setCell(h1, 'B19', awb.consignee_address || '');
      setCell(h1, 'B21', awb.consignee_phone || '');
      setCell(h1, 'B22', awb.consignee_city_country || '');
      setCell(h1, 'B23', awb.consignee_email || '');
      setCell(h1, 'B24', awb.consignee_account_no || '');

      // Agente transportista emisor
      setCell(h1, 'B26', awb.agent_name || 'INGELOX S.A.S.');
      setCell(h1, 'B27', awb.agent_nit || '900.526.917-1');
      setCell(h1, 'B28', awb.agent_city_country || 'Bogotá - Colombia');
      setCell(h1, 'B29', awb.agent_iata_code || '76-1 0215/0003');
      setCell(h1, 'B30', awb.agent_account_no || '');

      // Ruta y vuelos
      setCell(h1, 'B32', awb.origin_city || 'Bogota - Colombia');
      setCell(h1, 'B33', awb.origin_airport_code || 'BOG');
      setCell(h1, 'B35', awb.dest_airport_code || 'MEX');
      setCell(h1, 'B36', awb.first_carrier_acronym || `${awb.airline_name} (QT)`);
      setCell(h1, 'B38', awb.to_2nd || '');
      setCell(h1, 'B39', awb.by_2nd || '');
      setCell(h1, 'B40', awb.to_3rd || '');
      setCell(h1, 'B41', awb.by_3rd || '');
      setCell(h1, 'B43', awb.dest_city || '');
      setCell(h1, 'B44', awb.dest_airport_code || '');
      setCell(h1, 'B45', awb.flight_number || '');

      // Contabilidad & Moneda
      setCell(h1, 'B48', Number(awb.trm) || 0);
      setCell(h1, 'B49', awb.flight_date || new Date().toISOString().split('T')[0]);
      setCell(h1, 'B51', awb.currency || 'USD');

      setCell(h1, 'B53', awb.wt_val_payment === 'PPD' ? 'X' : '');
      setCell(h1, 'B54', awb.wt_val_payment === 'COLL' ? 'X' : '');
      setCell(h1, 'B55', awb.other_payment === 'PPD' ? 'X' : '');
      setCell(h1, 'B56', awb.other_payment === 'COLL' ? 'X' : '');

      // Valores declarados y seguro
      setCell(h1, 'B58', awb.declared_value_carriage || 'N.V.D.');
      setCell(h1, 'B59', awb.declared_value_customs || 'N.C.V.');
      setCell(h1, 'B61', awb.amount_insurance || 'N.I.L.');

      // Información de manejo
      setCell(h1, 'B63', awb.handling_information || 'ATTACHED DOCUMENTS');

      // Mercancía & Tarifas (MAWB)
      const cargo = awb.cargo;
      const pieces = Number(cargo.pieces) || 1;
      const grossW = Number(cargo.gross_weight) || 0;
      const chgW = Number(cargo.chargeable_weight) || grossW;
      const unit = cargo.weight_unit || 'k';

      setCell(h1, 'A69', pieces);
      setCell(h1, 'B69', grossW);
      setCell(h1, 'C69', unit);
      setCell(h1, 'D69', cargo.rate_class || 'Q');
      setCell(h1, 'E69', cargo.commodity_item_no || '');
      setCell(h1, 'F69', chgW);

      if (cargo.rate_charge_type === 'as_agreed') {
        setCell(h1, 'G69', 'AGREED');
        setCell(h1, 'H69', 'AS AGREED');
      } else {
        const rateVal = Number(cargo.rate_charge_value) || 0;
        const totalWCharge = Math.round(chgW * rateVal * 100) / 100;
        setCell(h1, 'G69', rateVal);
        setCell(h1, 'H69', totalWCharge);
      }
      setCell(h1, 'I69', cargo.nature_and_quantity || '');

      // Totales en tabla (Fila 77)
      setCell(h1, 'A77', pieces);
      setCell(h1, 'B77', grossW);
      setCell(h1, 'C77', unit);
      setCell(h1, 'H77', cargo.rate_charge_type === 'as_agreed' ? 'AS AGREED' : (Number(h1.getCell('H69').value) || 0));

      // Otros cargos
      setCell(h1, 'B79', awb.other_charges_line1 || '');
      setCell(h1, 'B80', awb.other_charges_line2 || '');
      setCell(h1, 'B81', awb.other_charges_line3 || '');

      // Liquidación de costos (Prepaid / Collect)
      const isPpd = awb.wt_val_payment === 'PPD';
      const weightChargeVal = cargo.rate_charge_type === 'as_agreed' ? 'AS AGREED' : (Number(h1.getCell('H69').value) || 0);

      if (isPpd) {
        setCell(h1, 'B84', weightChargeVal);
        setCell(h1, 'C84', 'PREPAID');
      } else {
        setCell(h1, 'B84', '');
        setCell(h1, 'C84', weightChargeVal);
      }

      setCell(h1, 'B85', awb.valuation_charge_prepaid || 0);
      setCell(h1, 'C85', awb.valuation_charge_collect || 0);
      setCell(h1, 'B86', awb.tax_prepaid || 0);
      setCell(h1, 'C86', awb.tax_collect || 0);
      setCell(h1, 'B87', awb.due_agent_prepaid || 0);
      setCell(h1, 'C87', awb.due_agent_collect || 0);
      setCell(h1, 'B88', awb.due_carrier_prepaid || 0);
      setCell(h1, 'C88', awb.due_carrier_collect || 0);

      const totPpd = cargo.rate_charge_type === 'as_agreed'
        ? 'AS AGREED'
        : Number(awb.total_prepaid) || ((typeof weightChargeVal === 'number' ? weightChargeVal : 0) + (awb.due_carrier_prepaid || 0) + (awb.due_agent_prepaid || 0));
      
      const totColl = Number(awb.total_collect) || 0;

      setCell(h1, 'B89', totPpd);
      setCell(h1, 'C89', totColl > 0 ? totColl : (isPpd ? 'PREPAID' : 'COLLECT'));

      // Firmas
      setCell(h1, 'B95', awb.shipper_certification || '');
      setCell(h1, 'B96', awb.executed_date || new Date().toISOString().split('T')[0]);
      setCell(h1, 'B97', awb.executed_place || 'Bogota, Colombia');
      setCell(h1, 'B98', awb.carrier_signature || 'INGELOX S.A.S.');

      // ─────────────────────────────────────────────────────────────────────────
      // 2. DATOS DE HAWB 1 (Si existe)
      // ─────────────────────────────────────────────────────────────────────────
      const hawb1 = awb.hawbs && awb.hawbs[0];
      if (hawb1) {
        setCell(h1, 'B102', hawb1.hawb_number || '');
        setCell(h1, 'B104', hawb1.shipper_name || '');
        setCell(h1, 'B105', hawb1.shipper_nit || '');
        setCell(h1, 'B106', hawb1.shipper_address || '');
        setCell(h1, 'B107', hawb1.shipper_phone || '');
        setCell(h1, 'B108', hawb1.shipper_city_country || '');
        setCell(h1, 'B109', hawb1.shipper_email || '');

        setCell(h1, 'B112', hawb1.consignee_name || '');
        setCell(h1, 'B113', hawb1.consignee_tax_id || '');
        setCell(h1, 'B114', hawb1.consignee_address || '');
        setCell(h1, 'B116', hawb1.consignee_city_country || '');
        setCell(h1, 'B117', hawb1.consignee_phone || '');

        setCell(h1, 'B120', hawb1.handling_information || 'ATTACHED DOCUMENTS');

        setCell(h1, 'A126', Number(hawb1.pieces) || pieces);
        setCell(h1, 'B126', Number(hawb1.gross_weight) || grossW);
        setCell(h1, 'C126', hawb1.weight_unit || unit);
        setCell(h1, 'F126', Number(hawb1.chargeable_weight) || chgW);
        setCell(h1, 'G126', hawb1.rate_charge_display || 'AGREED');
        setCell(h1, 'H126', hawb1.total_charge_display || 'AS AGREED');
        setCell(h1, 'I126', hawb1.nature_and_quantity || '');

        setCell(h1, 'H134', hawb1.weight_charge_display || 'AS AGREED');
        setCell(h1, 'B136', hawb1.other_charges_line1 || 'AS AGREED');
        setCell(h1, 'B141', hawb1.weight_charge_display || 'AS AGREED');
        setCell(h1, 'B145', 'AS AGREED');
        setCell(h1, 'B146', hawb1.total_charges_display || 'AS AGREED');
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 3. DATOS DE HAWB 2 (Si existe)
      // ─────────────────────────────────────────────────────────────────────────
      const hawb2 = awb.hawbs && awb.hawbs[1];
      if (hawb2) {
        setCell(h1, 'B154', hawb2.hawb_number || '');
        setCell(h1, 'B156', hawb2.shipper_name || '');
        setCell(h1, 'B157', hawb2.shipper_nit || '');
        setCell(h1, 'B158', hawb2.shipper_address || '');
        setCell(h1, 'B159', hawb2.shipper_phone || '');
        setCell(h1, 'B160', hawb2.shipper_city_country || '');
        setCell(h1, 'B161', hawb2.shipper_email || '');

        setCell(h1, 'B164', hawb2.consignee_name || '');
        setCell(h1, 'B165', hawb2.consignee_tax_id || '');
        setCell(h1, 'B166', hawb2.consignee_address || '');
        setCell(h1, 'B167', hawb2.consignee_phone || '');
        setCell(h1, 'B168', hawb2.consignee_city_country || '');
        setCell(h1, 'B169', hawb2.consignee_email || '');

        setCell(h1, 'B172', hawb2.handling_information || 'ATTACHED DOCUMENTS');

        setCell(h1, 'A178', Number(hawb2.pieces) || 1);
        setCell(h1, 'B178', Number(hawb2.gross_weight) || 0);
        setCell(h1, 'C178', hawb2.weight_unit || unit);
        setCell(h1, 'F178', Number(hawb2.chargeable_weight) || 0);
        setCell(h1, 'G178', hawb2.rate_charge_display || 'AGREED');
        setCell(h1, 'H178', hawb2.total_charge_display || 'AS AGREED');
        setCell(h1, 'I178', hawb2.nature_and_quantity || '');

        setCell(h1, 'H186', hawb2.weight_charge_display || 'AS AGREED');
        setCell(h1, 'B188', hawb2.other_charges_line1 || 'AS AGREED');
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 4. CONFIGURACIÓN DE SELECTOR DE COPIAS Y FÓRMULAS EN HOJAS DESTINO
      // ─────────────────────────────────────────────────────────────────────────
      const copyVal = (selectedCopy && selectedCopy !== 'all') ? selectedCopy : 'ORIGINAL 3 (FOR SHIPPER)';

      // En MAWB 1 , corregir celdas A58:G58 con el total real y configurar celda de Copias I64
      const wsMawb1 = workbook.getWorksheet('MAWB 1 ');
      if (wsMawb1) {
        ['A58', 'B58', 'C58', 'D58', 'E58', 'F58', 'G58'].forEach((addr) => {
          wsMawb1.getCell(addr).value = totPpd;
        });
        wsMawb1.getCell('H58').value = isPpd ? 'PREPAID' : 'COLLECT';

        // Configuración de Selector de Copia en celda I64 con Validación de Lista nativa de Excel
        const copyCell = wsMawb1.getCell('I64');
        copyCell.value = copyVal;
        copyCell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['Hoja3!$A$1:$A$8'],
          showErrorMessage: true,
          errorTitle: 'Copia no válida',
          error: 'Por favor seleccione una copia de la lista oficial.',
        };
      }

      // En HAWB 1, configurar celda de copia I62 con validación
      const wsHawb1 = workbook.getWorksheet('HAWB 1');
      if (wsHawb1) {
        const copyCell1 = wsHawb1.getCell('I62');
        copyCell1.value = copyVal;
        copyCell1.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['Hoja3!$A$1:$A$8'],
          showErrorMessage: true,
          errorTitle: 'Copia no válida',
          error: 'Por favor seleccione una copia de la lista oficial.',
        };
      }

      // En HAWB 2, corregir la celda C23 y configurar celda de copia I64
      const wsHawb2 = workbook.getWorksheet('HAWB 2');
      if (wsHawb2) {
        wsHawb2.getCell('C23').value = { formula: 'Hoja1!$B$36' };
        const copyCell2 = wsHawb2.getCell('I64');
        copyCell2.value = copyVal;
        copyCell2.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['Hoja3!$A$1:$A$8'],
          showErrorMessage: true,
          errorTitle: 'Copia no válida',
          error: 'Por favor seleccione una copia de la lista oficial.',
        };
      }

      // 5. Descargar archivo en navegador
      const finalBuffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([finalBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AWB_${awb.full_awb_number || 'GUIA'}_INGELOX.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error al exportar AWB a Excel:', err);
      setExportError(err.message || 'Error al generar archivo Excel de AWB');
      alert(`Error al exportar Excel: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportAwbToExcel,
    isExporting,
    exportError,
  };
}
