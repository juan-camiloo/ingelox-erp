import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface MarqueeTextProps {
  text: string;
  className?: string;
  containerClassName?: string;
  title?: string;
  style?: React.CSSProperties;
}

/**
 * MarqueeText
 * Muestra texto con truncado estándar (...) por defecto.
 * ÚNICA y EXCLUSIVAMENTE cuando el texto se corta y se generan los 3 puntos (scrollWidth > clientWidth),
 * activa la animación de marquee al hacer hover directo sobre este campo específico.
 * Si el texto cabe completo, permanece 100% estático sin ningún desplazamiento ni distracción visual.
 */
export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className = '',
  containerClassName = '',
  title,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  const evaluateOverflow = useCallback(() => {
    if (!containerRef.current || !textRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const contentWidth = textRef.current.scrollWidth;

    // Solo se considera cortado si el contenido excede el ancho disponible del contenedor
    if (contentWidth > containerWidth + 2) {
      setIsOverflowing(true);
      setScrollDistance(contentWidth - containerWidth + 14);
    } else {
      setIsOverflowing(false);
      setScrollDistance(0);
      setIsHovered(false);
    }
  }, []);

  useEffect(() => {
    evaluateOverflow();

    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      evaluateOverflow();
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [text, evaluateOverflow]);

  // Duración dinámica proporcional a la cantidad de texto oculto para lectura cómoda
  const duration = Math.max(3.5, Math.min(8, scrollDistance / 28));

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        evaluateOverflow();
        if (isOverflowing) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      className={`relative inline-block max-w-full overflow-hidden align-middle select-text ${containerClassName}`}
      style={style}
      title={title || text}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap transition-transform duration-200 ${
          isOverflowing && isHovered ? 'overflow-visible' : 'max-w-full truncate'
        } ${className}`}
        style={
          isOverflowing && isHovered
            ? {
                animation: `erp-dynamic-marquee ${duration}s ease-in-out infinite alternate`,
                ['--marquee-distance' as any]: `-${scrollDistance}px`,
              }
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
};
