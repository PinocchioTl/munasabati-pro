import { Phone, MessageCircle } from "lucide-react";

export function FloatingContact({
  phone,
  whatsapp,
}: {
  phone?: string | null;
  whatsapp?: string | null;
}) {
  const hasPhone = !!phone?.trim();
  const hasWa = !!whatsapp?.trim();
  if (!hasPhone && !hasWa) return null;

  const waDigits = (whatsapp ?? "").replace(/\D/g, "");

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-3 sm:left-6 z-40 flex flex-col gap-2.5 print:hidden">
      {hasWa && (
        <a
          href={`https://wa.me/${waDigits}`}
          target="_blank"
          rel="noreferrer"
          aria-label="تواصل عبر واتساب"
          className="size-11 sm:size-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition ring-4 ring-[#25D366]/20"
        >
          <MessageCircle className="size-5 sm:size-6" />
        </a>
      )}
      {hasPhone && (
        <a
          href={`tel:${phone}`}
          aria-label="اتصل بنا"
          className="size-11 sm:size-14 rounded-full bk-gold flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition ring-4 ring-[var(--bk-gold)]/20"
        >
          <Phone className="size-5 sm:size-6" />
        </a>
      )}
    </div>
  );
}
