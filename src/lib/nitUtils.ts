/**
 * src/lib/nitUtils.ts
 * Utilidades para cálculo de Dígito de Verificación (DV) y formato de NIT / Identificación.
 * Algoritmo Módulo 11 para identificación tributaria colombiana.
 */

const NIT_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/**
 * Calcula el dígito de verificación para un NIT o número de identificación.
 * @param nit Número de identificación sin puntos, guiones ni DV previo.
 * @returns Dígito de verificación como string ('0' - '9') o '' si el valor es inválido.
 */
export function calculateNitDv(nit: string | number): string {
  const clean = String(nit).replace(/\D/g, '');
  if (!clean) return '';

  let sum = 0;
  for (let i = 0; i < clean.length; i++) {
    const digit = parseInt(clean[clean.length - 1 - i], 10);
    const weight = NIT_WEIGHTS[i] || 0;
    sum += digit * weight;
  }

  const remainder = sum % 11;
  if (remainder === 0 || remainder === 1) {
    return String(remainder);
  }
  return String(11 - remainder);
}

/**
 * Formatea un NIT con separadores de miles y dígito de verificación opcional.
 * Ejemplo: 900528917 -> "900.528.917-1"
 */
export function formatNit(nit: string | number, dv?: string | null): string {
  const clean = String(nit).replace(/\D/g, '');
  if (!clean) return '';

  const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const finalDv = dv !== undefined && dv !== null && dv !== '' ? dv : calculateNitDv(clean);
  return finalDv ? `${formatted}-${finalDv}` : formatted;
}
