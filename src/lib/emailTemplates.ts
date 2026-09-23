/**
 * Archivo: src/lib/emailTemplates.ts
 * Plantillas de Correo Institucionales y Operativas exclusivas de INGELOX ERP.
 * 
 * NOTA DE IDENTIDAD DE MARCA:
 * Este diseño es 100% independiente del portal de clientes ("Cómo va mi carga").
 * Utiliza una estética corporativa de torre de control logístico: paleta Deep Navy (#0F172A),
 * acento técnico naranja Ingelox (#F35815), grilla de datos de alta densidad y pie institucional.
 */

import type { Shipment, ShipmentUpdate } from '../types/shipment';
import { getShipmentStatusLabel } from '../types/shipment';
import { formatDateDisplay, formatDateTimeDisplay } from './dateUtils';

interface EmailTemplateOptions {
  recipientName?: string;
  notes?: string;
}

/**
 * Genera el cascarón HTML corporativo de Ingelox ERP.
 */
function wrapCorporateTemplate(title: string, badgeText: string, contentHtml: string): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:#FFFFFF;border:1px solid #CBD5E1;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          
          <!-- CORPORATE HEADER (Deep Navy & Technical Orange) -->
          <tr>
            <td style="background-color:#0F172A;padding:24px 28px;border-bottom:3px solid #F35815;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px;color:#FFFFFF;text-transform:uppercase;">
                      INGELOX <span style="font-size:11px;font-weight:700;color:#F35815;background-color:#1E293B;padding:3px 8px;border-radius:4px;border:1px solid #334155;vertical-align:middle;margin-left:6px;">ERP</span>
                    </span>
                    <div style="font-size:11px;color:#94A3B8;margin-top:4px;letter-spacing:0.5px;text-transform:uppercase;">
                      Torre de Control & Operaciones de Tráfico
                    </div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;font-size:11px;font-weight:700;color:#F35815;background-color:rgba(243,88,21,0.12);border:1px solid rgba(243,88,21,0.3);padding:4px 10px;border-radius:20px;text-transform:uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding:28px 28px 20px 28px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- INSTITUTIONAL FOOTER -->
          <tr>
            <td style="background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 28px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">
                Ingelox Logistics SAS • Centro Operativo de Tráfico
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#94A3B8;">
                Este es un comunicado operativo emitido automáticamente desde Ingelox ERP Workstation.<br>
                Para consultas sobre esta operación, por favor responda manteniendo el número de DO en el asunto.
              </p>
            </td>
          </tr>

        </table>

        <!-- Copyright disclaimer -->
        <p style="margin-top:16px;font-size:11px;color:#94A3B8;text-align:center;">
          © ${new Date().getFullYear()} Ingelox SAS • Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Plantilla de Reporte de Novedad Operativa (Status Update).
 */
export function generateOperationalUpdateEmail(shipment: Shipment, update: Partial<ShipmentUpdate>, opts: EmailTemplateOptions = {}): string {
  const content = `
    <h2 style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:#0F172A;">
      Reporte de Novedad Operativa — DO #${shipment.do_number}
    </h2>

    <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#334155;">
      Estimado(a) <strong>${opts.recipientName || 'Operador / Cliente'}</strong>,<br>
      Se ha registrado una nueva novedad operativa en el expediente de tráfico correspondiente a la referencia indicada.
    </p>

    <!-- BOX DE NOVEDAD -->
    <div style="background-color:#F8FAFC;border:1px solid #CBD5E1;border-left:4px solid #F35815;border-radius:6px;padding:16px;margin-bottom:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;">Nuevo Estado:</td>
          <td align="right" style="font-size:12px;color:#0F172A;font-weight:700;">
            ${getShipmentStatusLabel(update.status || shipment.current_status)}
            <span style="display:block;font-size:10px;color:#64748B;font-weight:400;margin-top:2px;">
              ${formatDateTimeDisplay(update.created_at || new Date().toISOString())}
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:10px;font-size:14px;color:#1E293B;line-height:1.5;">
            "${update.description || 'Sin detalle adicional reportado.'}"
          </td>
        </tr>
        ${update.location ? `
        <tr>
          <td colspan="2" style="padding-top:8px;font-size:12px;color:#64748B;">
            📍 <strong>Ubicación reportada:</strong> ${update.location}
          </td>
        </tr>` : ''}
      </table>
    </div>

    <!-- DATOS DE LA OPERACIÓN -->
    <h3 style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">
      Resumen del Embarque
    </h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr style="background-color:#F8FAFC;">
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;width:35%;">DO / Referencia</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;font-weight:700;font-family:monospace;">${shipment.do_number}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;">Consignatario</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;font-weight:600;">${shipment.consignee || '--'}</td>
      </tr>
      <tr style="background-color:#F8FAFC;">
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;">Ruta</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;">${shipment.origin} → ${shipment.destination}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;">Transportadora / M/N</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;">${shipment.carrier || '--'} ${shipment.flight_vessel ? `(${shipment.flight_vessel})` : ''}</td>
      </tr>
      <tr style="background-color:#F8FAFC;">
        <td style="padding:10px 14px;color:#64748B;font-weight:600;">ETA (Estimada Llegada)</td>
        <td style="padding:10px 14px;color:#0F172A;font-weight:700;">${formatDateDisplay(shipment.eta)}</td>
      </tr>
    </table>
  `;

  return wrapCorporateTemplate(`Novedad Operativa DO ${shipment.do_number}`, 'ACTUALIZACIÓN', content);
}

/**
 * 2. Plantilla de Alerta de Vencimiento de Días Libres en Puerto.
 */
export function generateFreeDaysAlertEmail(shipment: Shipment, remainingDays: number): string {
  const isOverdue = remainingDays <= 0;
  const content = `
    <h2 style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:${isOverdue ? '#DC2626' : '#D97706'};">
      ⚠️ ALERTA OPERATIVA: Control de Días Libres — DO #${shipment.do_number}
    </h2>

    <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#334155;">
      Se notifica que el contenedor/embarque correspondiente al expediente <strong>${shipment.do_number}</strong>
      se encuentra en condición de <strong>${isOverdue ? 'DÍAS LIBRES VENCIDOS (Generando demoras)' : `RIESGO DE DEMORAS (${remainingDays} días restantes)`}</strong>.
    </p>

    <!-- BOX DE ALERTA -->
    <div style="background-color:${isOverdue ? '#FEF2F2' : '#FFFBEB'};border:1px solid ${isOverdue ? '#FCA5A5' : '#FDE68A'};border-left:4px solid ${isOverdue ? '#DC2626' : '#D97706'};border-radius:6px;padding:16px;margin-bottom:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#1E293B;font-weight:700;">
            ${isOverdue ? `Estado Crítico: Vencido hace ${Math.abs(remainingDays)} día(s)` : `Tiempo Restante: ${remainingDays} día(s) para devolución/retiro`}
          </td>
        </tr>
        <tr>
          <td style="padding-top:6px;font-size:12px;color:#475569;">
            Días libres pactados con naviera/almacén: <strong>${shipment.free_days || 0} días</strong>.
          </td>
        </tr>
      </table>
    </div>

    <!-- DATOS DEL CONTENEDOR Y PUERTO -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr style="background-color:#F8FAFC;">
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;width:35%;">Contenedor(es)</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;font-weight:700;font-family:monospace;">${shipment.container_number || '--'}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;">Línea / Naviera</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;font-weight:600;">${shipment.carrier || '--'}</td>
      </tr>
      <tr style="background-color:#F8FAFC;">
        <td style="padding:10px 14px;color:#64748B;font-weight:600;">Puerto de Arribo</td>
        <td style="padding:10px 14px;color:#0F172A;">${shipment.destination} (ATA: ${formatDateDisplay(shipment.ata || shipment.eta)})</td>
      </tr>
    </table>
  `;

  return wrapCorporateTemplate(`ALERTA DÍAS LIBRES - DO ${shipment.do_number}`, isOverdue ? 'DEMORAS ACTIVAS' : 'ALERTA DEMORAS', content);
}

/**
 * 3. Plantilla de Notificación de Apertura de Expediente (New Shipment).
 */
export function generateNewShipmentDispatchEmail(shipment: Shipment): string {
  const content = `
    <h2 style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:#0F172A;">
      Confirmación de Apertura de Operación — DO #${shipment.do_number}
    </h2>

    <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#334155;">
      Se ha creado satisfactoriamente en <strong>Ingelox ERP</strong> el expediente operativo de tráfico con número de referencia <strong>${shipment.do_number}</strong>.
    </p>

    <!-- TABLA DE DETALLES -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tr style="background-color:#F8FAFC;">
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;width:35%;">Referencia DO</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;font-weight:700;font-family:monospace;">${shipment.do_number}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;">Modalidad</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;text-transform:capitalize;">${shipment.shipment_type || '--'}</td>
      </tr>
      <tr style="background-color:#F8FAFC;">
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;">Exportador</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;">${shipment.exporter || '--'}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;">Consignatario</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;">${shipment.consignee || '--'}</td>
      </tr>
      <tr style="background-color:#F8FAFC;">
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;">Ruta</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;">${shipment.origin} → ${shipment.destination}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;font-weight:600;">ETD Estimada</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#0F172A;">${formatDateDisplay(shipment.etd)}</td>
      </tr>
      <tr style="background-color:#F8FAFC;">
        <td style="padding:10px 14px;color:#64748B;font-weight:600;">ETA Estimada</td>
        <td style="padding:10px 14px;color:#0F172A;font-weight:700;">${formatDateDisplay(shipment.eta)}</td>
      </tr>
    </table>
  `;

  return wrapCorporateTemplate(`Apertura Expediente DO ${shipment.do_number}`, 'APERTURA DO', content);
}
