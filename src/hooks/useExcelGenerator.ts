import { useState, useCallback } from 'react';
import ExcelJS from 'exceljs';
import type { ShippingInstruction, ShippingInstructionConcept } from '../types/practiko';

const HEADER_CELL_MAP: Record<string, string> = {
  fecha_creacion: 'D4',
  do_number: 'D5',
  comercial: 'D6',
  oferta: 'J6',
  cliente: 'D7',
  credito: 'J7',
  contacto: 'D8',
  telefono: 'D9',
  correo: 'D10',
  incoterm: 'D14',
  via: 'D15',
  complemento: 'J15',
  ruta: 'D16',
  modalidad: 'J16',
  tipo_de_embarque: 'D17',
};

function writeCellValue(sheet: any, cellRef: string, value: any) {
  const targetCell = sheet.getCell(cellRef);
  const masterCell = targetCell.master
    ? sheet.getCell(targetCell.master.address)
    : targetCell;
  masterCell.value = value;
}

export function useExcelGenerator() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  /**
   * Genera y descarga el archivo Excel oficial (.xlsx) de Instrucciones de Embarque
   * utilizando la plantilla original plantilla-instrucciones.xlsx.
   */
  const exportInstructionToExcel = useCallback(async (
    instruction: ShippingInstruction,
    concepts: ShippingInstructionConcept[] = instruction.concepts || []
  ) => {
    setIsExporting(true);
    setExportError(null);

    try {
      // 1. Obtener la plantilla oficial desde /plantilla-instrucciones.xlsx
      const response = await fetch('/plantilla-instrucciones.xlsx');
      if (!response.ok) {
        throw new Error('No se pudo cargar la plantilla oficial de Excel');
      }
      const arrayBuffer = await response.arrayBuffer();

      // 2. Cargar en ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const sheet = workbook.getWorksheet('FORMATO INSTRUCCIONES') || workbook.worksheets[0];
      if (!sheet) {
        throw new Error('La plantilla no contiene la hoja de instrucciones requerida');
      }

      // 3. Escribir campos del encabezado
      const fields: Record<string, string> = {
        fecha_creacion: instruction.fecha_creacion || '',
        do_number: instruction.do_number || '',
        comercial: instruction.comercial || '',
        oferta: instruction.oferta || '',
        cliente: instruction.cliente || '',
        credito: instruction.credito || '',
        contacto: instruction.contacto || '',
        telefono: instruction.telefono || '',
        correo: instruction.correo || '',
        incoterm: instruction.incoterm || '',
        via: instruction.via || '',
        complemento: instruction.complemento || '',
        ruta: instruction.ruta || '',
        modalidad: instruction.modalidad || '',
        tipo_de_embarque: instruction.tipo_de_embarque || '',
      };

      for (const [key, cell] of Object.entries(HEADER_CELL_MAP)) {
        if (fields[key] !== undefined) {
          writeCellValue(sheet, cell, fields[key]);
        }
      }

      // 4. Escribir conceptos de operaciones (filas 22 en adelante)
      concepts.forEach((concept, index) => {
        const rowNum = 22 + index;
        if (rowNum <= 41) {
          // Filas preformateadas en la plantilla
          let formaPago = concept.forma_pago || '';
          if (formaPago === 'CONTADO') formaPago = 'Prepaid';
          if (formaPago === 'CREDITO') formaPago = 'Collect';

          writeCellValue(sheet, `C${rowNum}`, concept.concepto || '');
          writeCellValue(sheet, `D${rowNum}`, concept.proveedor || '');
          writeCellValue(sheet, `F${rowNum}`, formaPago);
          writeCellValue(sheet, `H${rowNum}`, concept.costo ? Number(concept.costo) || concept.costo : '');
          writeCellValue(sheet, `J${rowNum}`, concept.venta ? Number(concept.venta) || concept.venta : '');
          writeCellValue(sheet, `K${rowNum}`, concept.facturar_a || '');
        }
      });

      // 5. Escribir comentarios en el bloque de observaciones (C44)
      if (instruction.comentarios) {
        writeCellValue(sheet, 'C44', instruction.comentarios);
      }

      // 6. Generar buffer binario y descargar
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanDo = (instruction.do_number || 'INSTRUCCION').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.href = url;
      link.download = `Instruccion_Embarque_${cleanDo}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error al generar Excel de instrucción:', err);
      setExportError(err.message || 'Error al exportar a Excel');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportInstructionToExcel,
    isExporting,
    exportError,
  };
}
