/**
 * Utilidad de persistencia de borradores de formularios en localStorage.
 * Permite evitar que el operador pierda información si navega accidentalmente,
 * recarga la página o se cierra la sesión/pestaña.
 */

export interface FormDraft<T> {
  key: string;
  data: T;
  savedAt: string;
}

export const DraftStorage = {
  saveDraft<T>(key: string, data: T): void {
    try {
      const draft: FormDraft<T> = {
        key,
        data,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`ingelox_draft_${key}`, JSON.stringify(draft));
    } catch (err) {
      console.warn('No se pudo guardar el borrador en localStorage:', err);
    }
  },

  getDraft<T>(key: string): FormDraft<T> | null {
    try {
      const raw = localStorage.getItem(`ingelox_draft_${key}`);
      if (!raw) return null;
      return JSON.parse(raw) as FormDraft<T>;
    } catch {
      return null;
    }
  },

  clearDraft(key: string): void {
    try {
      localStorage.removeItem(`ingelox_draft_${key}`);
    } catch {}
  },
};

export function saveFormDraft<T>(key: string, data: T): void {
  DraftStorage.saveDraft(key, data);
}

export function loadFormDraft<T>(key: string): T | null {
  const item = DraftStorage.getDraft<T>(key);
  return item ? item.data : null;
}

export function clearFormDraft(key: string): void {
  DraftStorage.clearDraft(key);
}
