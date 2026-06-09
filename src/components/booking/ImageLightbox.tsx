import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function ImageLightbox({
  images,
  startIndex = 0,
  onClose,
  alt,
}: {
  images: string[];
  startIndex?: number;
  onClose: () => void;
  alt?: string;
}) {
  const [i, setI] = useState(startIndex);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setI(p => (p + 1) % images.length);
      if (e.key === "ArrowRight") setI(p => (p - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [images.length, onClose]);

  if (images.length === 0) return null;

  const prev = () => setI(p => (p - 1 + images.length) % images.length);
  const next = () => setI(p => (p + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center select-none"
      onClick={onClose}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStart.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
        touchStart.current = null;
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 z-10 size-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur"
        aria-label="إغلاق"
      >
        <X className="size-5" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 size-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur"
            aria-label="السابق"
          >
            <ChevronRight className="size-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 size-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur"
            aria-label="التالي"
          >
            <ChevronLeft className="size-6" />
          </button>
        </>
      )}

      <img
        src={images[i]}
        alt={alt ?? ""}
        className="max-h-[90vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-3 py-2 rounded-full backdrop-blur">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setI(idx); }}
              className={`size-2 rounded-full transition ${idx === i ? "bg-white w-6" : "bg-white/40"}`}
              aria-label={`الصورة ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
