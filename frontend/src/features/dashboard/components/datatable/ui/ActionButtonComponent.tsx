import Image from "next/image";
import { useRef, useState } from "react";

export function ActionButtonComponent({
  icon,
  title,
  onClick,
  disabled = false,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [place, setPlace] = useState<"top" | "bottom">("bottom");
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const handleEnter = () => {
    if (!disabled) return;

    const el = btnRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    const margin = 8;
    const estimatedWidth = 220; // aprox. ancho max del tooltip
    const half = estimatedWidth / 2;

    // Centro del botón
    const desiredLeft = rect.left + rect.width / 2;

    // Clamp para que no se salga horizontalmente (considerando un ancho aprox)
    const left = clamp(desiredLeft, margin + half, window.innerWidth - margin - half);

    // Decide arriba/abajo según espacio
    const tooltipHeight = 32; // aprox
    const canShowBottom = rect.bottom + margin + tooltipHeight <= window.innerHeight;
    const placement: "top" | "bottom" = canShowBottom ? "bottom" : "top";

    const top =
      placement === "bottom"
        ? rect.bottom + margin
        : rect.top - margin - tooltipHeight;

    setPlace(placement);
    setPos({ top, left });
    setShowTooltip(true);
  };

  const handleLeave = () => setShowTooltip(false);

  return (
    <>
      {disabled && showTooltip && (
        <div
          className="
            fixed z-[9999]
            bg-gray-800 text-white text-[10px] px-2 py-1
            rounded-md shadow-lg opacity-90
            pointer-events-none
          "
          style={{
            top: pos.top,
            left: pos.left,
            transform: "translateX(-50%)",
            maxWidth: 220,
            whiteSpace: "normal",     // permite salto de línea
            overflowWrap: "anywhere", // corta palabras largas si hace falta
            lineHeight: "1.2",
          }}
        >
          {title}
        </div>
      )}

      <button
        ref={btnRef}
        className={
          disabled
            ? "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-40 cursor-not-allowed"
            : "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-red-300/60"
        }
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick();
        }}
      >
        <Image src={icon} alt={`${title} icon`} className="h-4 w-4" width={16} height={16} />
      </button>
    </>
  );
}
