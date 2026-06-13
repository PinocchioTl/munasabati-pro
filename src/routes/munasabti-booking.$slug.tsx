import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPublicOwner } from "@/lib/booking-public.functions";
import { Crown, Loader2, Phone, EyeOff } from "lucide-react";
import { FloatingContact } from "@/components/booking/FloatingContact";

export const Route = createFileRoute("/munasabti-booking/$slug")({
  component: BookingShell,
});

function BookingShell() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const { data: owner, isLoading, error } = useQuery({
    queryKey: ["public-owner", slug],
    queryFn: () => getPublicOwner({ data: { slug } }),
    retry: false,
  });

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#F5F3EE]">
        <Loader2 className="size-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }
  if (error || !owner) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#F5F3EE] p-6">
        <div className="max-w-md text-center">
          <div className="size-16 mx-auto rounded-2xl bg-[#1E1B2E] text-[#D4AF37] flex items-center justify-center mb-4">
            <Crown />
          </div>
          <h1 className="text-xl font-bold text-[#1E1B2E]">الصفحة غير متوفرة</h1>
          <p className="text-sm text-muted-foreground mt-2">رابط الحجز غير صحيح.</p>
        </div>
      </div>
    );
  }

  const cssVars = {
    "--bk-primary": owner.secondary_color || "#1E1B2E",
    "--bk-gold": owner.primary_color || "#D4AF37",
    "--bk-button": (owner as any).button_color || owner.primary_color || "#D4AF37",
    "--bk-bg": owner.background_color || "#F5F3EE",
  } as React.CSSProperties;

  const social = (owner as any).social_links || {};
  const whatsapp = social.whatsapp || "";

  if (!owner.booking_enabled) {
    return (
      <div dir="rtl" lang="ar" style={cssVars} className="min-h-screen flex items-center justify-center p-6" data-bk-root>
        <style>{baseStyles}</style>
        <div className="max-w-md text-center bg-white rounded-3xl p-8 shadow-xl">
          <div className="size-16 mx-auto rounded-2xl bk-primary flex items-center justify-center mb-4">
            {owner.logo_url ? <img src={owner.logo_url} alt="" className="size-10 object-contain" /> : <EyeOff className="bk-text-gold" />}
          </div>
          <h1 className="text-xl font-bold bk-text-primary mb-2">{owner.company_name}</h1>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {(owner as any).disabled_message?.trim() || "الحجوزات متوقفة حالياً وسيتم فتحها قريباً."}
          </p>
          {owner.phone && (
            <a href={`tel:${owner.phone}`} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bk-gold font-bold text-sm">
              <Phone className="size-4" /> {owner.phone}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" lang="ar" style={cssVars} className="min-h-screen flex flex-col" data-bk-root>
      <style>{baseStyles}</style>

      <header className="sticky top-0 z-30 bk-primary border-b bk-border-gold shadow-xl backdrop-blur supports-[backdrop-filter]:bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <a href={`/munasabti-booking/${slug}`} className="flex items-center gap-3 min-w-0 flex-1">
            <div className="size-10 rounded-lg bg-white/5 border bk-border-gold flex items-center justify-center overflow-hidden shrink-0">
              {owner.logo_url ? <img src={owner.logo_url} alt="" className="size-full object-contain" /> : <Crown className="bk-text-gold size-5" />}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm sm:text-base truncate">{owner.company_name || "Munasabati Booking"}</div>
              {owner.tagline && <div className="text-[10px] sm:text-xs opacity-80 truncate">{owner.tagline}</div>}
            </div>
          </a>
          {owner.phone && (
            <a href={`tel:${owner.phone}`} className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
              <Phone className="size-3.5" /> {owner.phone}
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-9 pb-32 lg:pb-10">
        <Outlet />
      </main>

      <footer className="bk-primary mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs opacity-80">
          <div className="font-bold">{owner.company_name}</div>
          <div className="mt-1">مدعوم بواسطة <span className="bk-text-gold font-bold">Munasabati</span></div>
        </div>
      </footer>

      <FloatingContact phone={owner.phone} whatsapp={whatsapp} />
    </div>
  );
}

const baseStyles = `
  [data-bk-root]{background:var(--bk-bg);color:var(--bk-primary);font-family:inherit;background-image:linear-gradient(90deg,color-mix(in oklab,var(--bk-gold) 7%,transparent) 1px,transparent 1px),linear-gradient(color-mix(in oklab,var(--bk-gold) 5%,transparent) 1px,transparent 1px);background-size:72px 72px}
  [data-bk-root] .bk-primary{background:var(--bk-primary);color:#fff}
  [data-bk-root] .bk-gold{background:var(--bk-button);color:var(--bk-primary)}
  [data-bk-root] .bk-text-primary{color:var(--bk-primary)}
  [data-bk-root] .bk-text-gold{color:var(--bk-gold)}
  [data-bk-root] .bk-border-gold{border-color:var(--bk-gold)}
  [data-bk-root] main .bg-white{background:color-mix(in oklab,#fff 97%,var(--bk-gold) 3%);border:1px solid color-mix(in oklab,var(--bk-gold) 25%,transparent);box-shadow:0 16px 40px -30px color-mix(in oklab,var(--bk-primary) 35%,transparent)}
  [data-bk-root] main input,[data-bk-root] main textarea,[data-bk-root] main select{background:color-mix(in oklab,#fff 94%,var(--bk-gold) 6%);border-color:color-mix(in oklab,var(--bk-gold) 30%,transparent)}
  [data-bk-root] main :is(h1,h2,h3){letter-spacing:-.015em}
  [data-bk-root] .scrollbar-none::-webkit-scrollbar{display:none}
`;
