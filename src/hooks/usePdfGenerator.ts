import { useState, useCallback } from 'react';

export interface PdfPrintOptions {
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'Letter' | 'A4';
  title?: string;
  margin?: string;
}

export function usePdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Imprime directamente un HTML mediante un iframe aislado en memoria.
   * Abre el diálogo nativo del sistema ("Guardar como PDF" o Impresora)
   * con calidad vectorial nítida al 100% y sin dependencias pesadas.
   */
  const printHtml = useCallback((htmlContent: string, options: PdfPrintOptions = {}) => {
    setIsGenerating(true);
    setError(null);

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('No se pudo inicializar el entorno de impresión');
      }

      doc.open();
      doc.write(htmlContent);
      if (options.title) {
        doc.title = options.title;
      }
      doc.close();

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (err: any) {
            console.error('Error al invocar impresión:', err);
            setError(err.message || 'Error al imprimir');
          } finally {
            setTimeout(() => {
              document.body.removeChild(iframe);
              setIsGenerating(false);
            }, 1000);
          }
        }, 400);
      };
    } catch (err: any) {
      console.error('Error en printHtml:', err);
      setError(err.message || 'Error al generar documento');
      setIsGenerating(false);
    }
  }, []);

  /**
   * Abre una ventana emergente para previsualizar el documento antes de imprimir o descargar
   */
  const previewHtml = useCallback((htmlContent: string, title = 'Vista Previa') => {
    const previewWin = window.open('', '_blank', 'width=1024,height=768');
    if (previewWin) {
      previewWin.document.open();
      previewWin.document.write(htmlContent);
      previewWin.document.title = title;
      previewWin.document.close();
    }
  }, []);

  /**
   * Descarga el documento como archivo HTML independiente y portable
   */
  const downloadHtml = useCallback((htmlContent: string, fileName: string) => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    printHtml,
    previewHtml,
    downloadHtml,
    isGenerating,
    error,
  };
}
