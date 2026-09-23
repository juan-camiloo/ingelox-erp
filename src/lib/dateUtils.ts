/**
 * Archivo: src/lib/dateUtils.ts
 * Utilidades para manejo, parseo, visualización y serialización de fechas en Ingelox ERP.
 * Garantiza consistencia en zona horaria local (Colombia / America/Bogota UTC-5).
 */

/**
 * Parsea con seguridad cualquier cadena de fecha hacia un objeto Date en zona horaria local.
 * Evita el salto de 1 día que produce JavaScript al parsear 'YYYY-MM-DD' como UTC medianoche.
 */
export function parseDateSafe(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // 1. Formato YYYY-MM-DD o medianoche UTC YYYY-MM-DDT00:00:00Z
  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s]00:00(?::00(?:\.000)?)?(?:[Zz]|\+00(?::?00)?)?)?$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    // Fijar a mediodía local para evitar saltos por DST o conversiones
    return new Date(year, month, day, 12, 0, 0);
  }

  // 2. Fecha y hora local sin información de zona (ej: "2026-09-17 14:30" o "2026-09-17T14:30")
  const localDateTimeMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (localDateTimeMatch) {
    const year = Number(localDateTimeMatch[1]);
    const month = Number(localDateTimeMatch[2]) - 1;
    const day = Number(localDateTimeMatch[3]);
    const hours = Number(localDateTimeMatch[4]);
    const minutes = Number(localDateTimeMatch[5]);
    const seconds = localDateTimeMatch[6] ? Number(localDateTimeMatch[6]) : 0;
    return new Date(year, month, day, hours, minutes, seconds);
  }

  // 3. Cadena con zona horaria explícita
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formatea una fecha para visualización en pantalla (ej: "17 sept.").
 */
export function formatDateDisplay(
  value: string | null | undefined,
  locale = 'es-CO',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return '--';
  const parsed = parseDateSafe(value);
  if (!parsed) return value;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return parsed.toLocaleDateString(locale, defaultOptions);
}

/**
 * Formatea una fecha y hora (ej: "17 sept., 14:30").
 */
export function formatDateTimeDisplay(
  value: string | null | undefined,
  locale = 'es-CO',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return '--';
  const parsed = parseDateSafe(value);
  if (!parsed) return value;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  return parsed.toLocaleString(locale, defaultOptions);
}

/**
 * Formatea una fecha completa incluyendo año (ej: "17 de sept. de 2026").
 */
export function formatDateFull(value: string | null | undefined, locale = 'es-CO'): string {
  if (!value) return '--';
  const parsed = parseDateSafe(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Convierte un Date a 'YYYY-MM-DD' en la zona horaria local para inputs tipo date.
 */
export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte un Date a 'YYYY-MM-DDTHH:mm' para inputs tipo datetime-local.
 */
export function formatDateTimeInputValue(date: Date): string {
  const datePart = formatDateInputValue(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${datePart}T${hours}:${minutes}`;
}

/**
 * Convierte un valor de la DB a formato 'YYYY-MM-DD' para <input type="date">.
 */
export function formatIsoToLocalDateInput(value: string | null | undefined): string {
  if (!value) return '';
  const parsed = parseDateSafe(value);
  if (!parsed) return '';
  return formatDateInputValue(parsed);
}

/**
 * Convierte un valor de la DB a formato 'YYYY-MM-DDTHH:mm' para <input type="datetime-local">.
 */
export function formatIsoToLocalDateTimeInput(value: string | null | undefined): string {
  if (!value) return '';
  const parsed = parseDateSafe(value);
  if (!parsed) return '';
  return formatDateTimeInputValue(parsed);
}

/**
 * Prepara un valor de fecha pura (ETD, ETA) para guardarse en la columna 'date' de PostgreSQL.
 */
export function serializeDateForDb(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const parsed = parseDateSafe(trimmed);
  return parsed ? formatDateInputValue(parsed) : null;
}

/**
 * Prepara un valor de fecha y hora (ATD, ATA, Cutoff) para guardarse en una columna
 * 'timestamp with time zone' de PostgreSQL en formato ISO 8601 con zona.
 */
export function serializeDateTimeForDb(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/[Zz]|[+-]\d{2}(?::?\d{2})?$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const hours = Number(match[4]);
    const minutes = Number(match[5]);
    const seconds = match[6] ? Number(match[6]) : 0;
    const localDate = new Date(year, month, day, hours, minutes, seconds);
    return Number.isNaN(localDate.getTime()) ? trimmed : localDate.toISOString();
  }

  const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]) - 1;
    const day = Number(dateMatch[3]);
    const localDate = new Date(year, month, day, 0, 0, 0);
    return Number.isNaN(localDate.getTime()) ? trimmed : localDate.toISOString();
  }

  const fallback = parseDateSafe(trimmed);
  return fallback ? fallback.toISOString() : null;
}

/**
 * Determina si una carga tiene ETA vencido (fecha estimada ya pasó y aún no ha finalizado/arribado).
 */
export function isEtaOverdue(etaStr?: string | null, status?: string | null): boolean {
  if (!etaStr) return false;
  // Si ya arribó o finalizó, no está retrasada
  if (status && (status.includes('arrival') || status === 'arrived' || status.includes('delivered'))) {
    return false;
  }
  const parsedEta = parseDateSafe(etaStr);
  if (!parsedEta) return false;

  const now = new Date();
  // El vencimiento ocurre al final del día del ETA
  const endOfEtaDay = new Date(parsedEta.getFullYear(), parsedEta.getMonth(), parsedEta.getDate(), 23, 59, 59, 999);
  return now.getTime() > endOfEtaDay.getTime();
}

/**
 * Calcula los días libres restantes y estado de alerta para contenedores en puerto/bodega.
 * @param etaOrAta Fecha de llegada estimada o real
 * @param freeDays Días libres otorgados por naviera/almacén
 */
export function calculateFreeDaysRemaining(etaOrAta?: string | null, freeDays?: number | null) {
  if (freeDays === null || freeDays === undefined || freeDays === 0 || !etaOrAta) {
    return null;
  }

  const arrivalDate = parseDateSafe(etaOrAta);
  if (!arrivalDate) return null;

  // Fecha límite = fecha de arribo + freeDays
  const limitDate = new Date(arrivalDate.getFullYear(), arrivalDate.getMonth(), arrivalDate.getDate() + freeDays, 23, 59, 59);
  const now = new Date();
  const diffMs = limitDate.getTime() - now.getTime();
  const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    remainingDays,
    limitDate,
    isOverdue: remainingDays <= 0,
    isExpiringSoon: remainingDays > 0 && remainingDays <= 3,
  };
}
