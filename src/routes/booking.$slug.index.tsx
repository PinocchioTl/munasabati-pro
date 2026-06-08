import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPublicOwner } from "@/lib/booking-public.functions";
import { Sparkles, ShoppingBag, Package, ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/booking/$slug/")({
  component: Landing,
});

function Landing() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const { data: owner } = useQuery({
    queryKey: ["public-owner", slug],
    queryFn: () => getPublicOwner({ data: { slug } }),
    retry: false,
  });

  if (!owner) return null;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl overflow-hidden shadow-xl bg-white relative">
        {owner.cover_url ? (
          <div className="aspect-[16/7] sm:aspect-[16/6] relative">
            <img src={owner.cover_url} alt={owner.company_name ?? ""} className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[16/6] bk-primary" />
        )}
        <div className={owner.cover_url ? "absolute inset-0 flex flex-col justify-end p-6 sm:p-10 text-white" : "p-6 sm:p-10 text-white bk-primary"}>
          <div className="flex items-center gap-3 mb-3">
            {owner.logo_url && (
              <div className="size-14 rounded-2xl bg-white/15 backdrop-blur p-1.5 shrink-0">
                <img src={owner.logo_url} alt="" className="size-full object-contain" />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold drop-shadow">{owner.company_name}</h1>
              {owner.tagline && <p className="text-sm sm:text-base opacity-90 mt-1">{owner.tagline}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to={"/booking/$slug/request" as any} params={{ slug } as any}
              className="bk-gold inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] transition">
              <ShoppingBag className="size-5" /> ابدأ الحجز
            </Link>
          </div>
          <p className="text-xs opacity-80 mt-3">اختر تاريخ مناسبتك أولاً لعرض الديكورات والمستلزمات المتوفرة</p>
        </div>
      </section>

      {owner.description && (
        <section className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-lg font-bold bk-text-primary mb-3 flex items-center gap-2">
            <Sparkles className="size-4 bk-text-gold" /> من نحن
          </h2>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{owner.description}</p>
        </section>
      )}

      <section className="bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-lg font-bold bk-text-primary mb-4">كيف يعمل الحجز؟</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Step n={1} title="اختر التاريخ" desc="حدد تاريخ مناسبتك أولاً" />
          <Step n={2} title="اختر الديكورات" desc="من بين العناصر المتوفرة في ذلك اليوم" />
          <Step n={3} title="أرسل الطلب" desc="سنتواصل معك للتأكيد" />
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-lg font-bold bk-text-primary mb-4">لماذا تختارنا؟</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {["جودة احترافية وضمان كامل", "أسعار شفافة وعروض موسمية", "فحص توفر فوري حسب التاريخ", "خدمة عملاء سريعة الاستجابة"].map(t => (
            <div key={t} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 bk-text-gold shrink-0" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ slug, to, icon, title, desc }: { slug: string; to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to as any} params={{ slug } as any}
      className="group bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition border border-transparent hover:bk-border-gold">
      <div className="size-11 rounded-xl bk-gold flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="font-bold bk-text-primary text-base">{title}</div>
      <div className="text-xs text-gray-600 mt-1">{desc}</div>
      <div className="mt-3 text-xs bk-text-gold font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
        تصفح <ArrowLeft className="size-3" />
      </div>
    </Link>
  );
}