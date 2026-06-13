import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getPublicOwner, getPublicGallery, getPublicDecorations, getPublicStats,
} from "@/lib/booking-public.functions";
import {
  Sparkles, ShoppingBag, Package, Phone, Instagram, Twitter, MessageCircle, Music2, Facebook,
  CalendarDays, CheckCircle2, Users, Award, ChevronLeft, Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";
import { ImageLightbox } from "@/components/booking/ImageLightbox";

export const Route = createFileRoute("/munasabti-booking/$slug/")({
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

  const sectionsConfig: { id: string; visible: boolean }[] = Array.isArray((owner as any)?.sections_config)
    ? (owner as any).sections_config
    : [
        { id: "hero", visible: true }, { id: "about", visible: true }, { id: "gallery", visible: true },
        { id: "decorations", visible: true }, { id: "contact", visible: true },
      ];
  const visible = (id: string) => sectionsConfig.find(s => s.id === id)?.visible !== false;

  return (
    <div className="space-y-8 sm:space-y-12">
      {visible("hero") && <Hero owner={owner} slug={slug} />}
      <TrustBadges slug={slug} />
      {visible("about") && owner.description && <About owner={owner} />}
      {visible("decorations") && <FeaturedDecorations slug={slug} showPrices={owner.show_prices} />}
      {visible("gallery") && <Gallery slug={slug} />}
      {visible("contact") && <Contact owner={owner} />}
      <BigCTA slug={slug} />
    </div>
  );
}

/* ──────────────── Hero ──────────────── */

function Hero({ owner, slug }: any) {
  const title = owner.hero_title?.trim() || owner.company_name || "نظم مناسبتك معنا";
  const subtitle = owner.hero_subtitle?.trim() || owner.tagline;
  const description = owner.hero_description?.trim();
  return (
    <section className="relative rounded-2xl overflow-hidden shadow-2xl border bk-border-gold">
      {owner.cover_url ? (
        <div className="relative">
          <div className="aspect-[16/10] sm:aspect-[16/7]">
            <img
              src={owner.cover_url}
              alt={owner.company_name ?? ""}
              loading="eager"
              fetchPriority="high"
              className="absolute inset-0 size-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/15" />
          <div className="absolute inset-3 sm:inset-5 border border-white/20 rounded-xl pointer-events-none" />
        </div>
      ) : (
        <div className="aspect-[16/7] bk-primary" />
      )}

      <div className="absolute inset-0 flex flex-col justify-end p-7 sm:p-12 text-white">
        <div className="flex items-center gap-3 mb-4">
          {owner.logo_url && (
            <div className="size-14 sm:size-16 rounded-2xl bg-white/15 backdrop-blur-md p-2 shrink-0 ring-2 ring-white/20">
              <img src={owner.logo_url} alt="" className="size-full object-contain" />
            </div>
          )}
          <div className="min-w-0">
            <div className="w-12 h-px bk-gold mb-3" />
            <h1 className="text-2xl sm:text-4xl font-bold leading-tight drop-shadow-lg">{title}</h1>
            {subtitle && <p className="text-sm sm:text-base opacity-95 mt-1 drop-shadow">{subtitle}</p>}
          </div>
        </div>

        {description && (
          <p className="text-xs sm:text-sm opacity-95 max-w-2xl mb-5 leading-relaxed line-clamp-3 drop-shadow">
            {description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link
            to="/munasabti-booking/$slug/request"
            params={{ slug }}
            className="bk-gold inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:scale-[1.03] active:scale-95 transition"
          >
            <ShoppingBag className="size-5" /> ابدأ الحجز الآن
          </Link>
          {owner.phone && (
            <a
              href={`tel:${owner.phone}`}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base bg-white/15 backdrop-blur-md text-white border border-white/25 hover:bg-white/25 transition"
            >
              <Phone className="size-4" /> اتصل بنا
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/* ──────────────── Trust badges ──────────────── */

function TrustBadges({ slug }: { slug: string }) {
  const { data } = useQuery({
    queryKey: ["public-stats", slug],
    queryFn: () => getPublicStats({ data: { slug } }),
    retry: false,
  });

  const items = [
    { value: data?.events ?? 0, label: "مناسبة منجزة", icon: CheckCircle2 },
    { value: data?.customers ?? 0, label: "عميل سعيد", icon: Users },
    { value: data?.gallery ?? 0, label: "صورة في المعرض", icon: Award },
  ].filter(it => it.value > 0);

  if (items.length === 0) return null;

  return (
    <section className="grid grid-cols-3 gap-2 sm:gap-4">
      {items.map(({ value, label, icon: Icon }) => (
        <div key={label} className="bg-white rounded-xl p-4 sm:p-5 text-center shadow-sm">
          <div className="size-10 sm:size-12 mx-auto rounded-xl bk-gold flex items-center justify-center mb-2">
            <Icon className="size-5 sm:size-6" />
          </div>
          <div className="text-xl sm:text-3xl font-bold bk-text-primary leading-none">
            {value}+
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 mt-1.5">{label}</div>
        </div>
      ))}
    </section>
  );
}

/* ──────────────── About ──────────────── */

function About({ owner }: any) {
  return (
    <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
      <h2 className="text-xl font-bold bk-text-primary mb-3 flex items-center gap-2">
        <Sparkles className="size-5 bk-text-gold" /> من نحن
      </h2>
      <p className="text-sm sm:text-base leading-relaxed text-gray-700 whitespace-pre-line">
        {owner.description}
      </p>
    </section>
  );
}

/* ──────────────── Featured decorations ──────────────── */

function FeaturedDecorations({ slug, showPrices }: { slug: string; showPrices: boolean }) {
  const { data: items = [] } = useQuery({
    queryKey: ["public-decorations", slug],
    queryFn: () => getPublicDecorations({ data: { slug } }),
  });
  if (items.length === 0) return null;
  const preview = items.slice(0, 6);
  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold bk-text-primary flex items-center gap-2">
            <Sparkles className="size-5 bk-text-gold" /> ديكوراتنا المميزة
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">اختر ما يناسب مناسبتك</p>
        </div>
        <Link
          to="/munasabti-booking/$slug/decorations"
          params={{ slug }}
          className="text-xs sm:text-sm font-bold bk-text-primary flex items-center gap-1 hover:gap-2 transition-all"
        >
          عرض الكل <ChevronLeft className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {preview.map((d: any) => (
          <Link
            key={d.id}
            to="/munasabti-booking/$slug/decorations/$id"
            params={{ slug, id: d.id }}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition border border-transparent hover:bk-border-gold"
          >
            <div className="aspect-square bg-gray-100 overflow-hidden">
              {d.images?.[0] ? (
                <img src={d.images[0]} alt={d.name} loading="lazy" decoding="async"
                  className="size-full object-cover group-hover:scale-105 transition duration-500" />
              ) : (
                <div className="size-full flex items-center justify-center text-gray-300">
                  <Sparkles className="size-8" />
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="font-bold text-sm bk-text-primary truncate">{d.name}</div>
              {showPrices && d.price > 0 && (
                <div className="text-xs bk-text-gold font-bold mt-1">
                  {new Intl.NumberFormat("ar-DZ").format(d.price)} د.ج
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ──────────────── Gallery with lightbox ──────────────── */

function Gallery({ slug }: { slug: string }) {
  const { data: items = [] } = useQuery({
    queryKey: ["public-gallery", slug],
    queryFn: () => getPublicGallery({ data: { slug } }),
  });
  const [openAt, setOpenAt] = useState<number | null>(null);
  if (items.length === 0) return null;

  const urls = items.map((it: any) => it.image_url);

  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold bk-text-primary mb-4 flex items-center gap-2">
        <ImageIcon className="size-5 bk-text-gold" /> معرض أعمالنا
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {items.map((it: any, idx: number) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setOpenAt(idx)}
            className="group aspect-square rounded-xl overflow-hidden bg-gray-100 relative cursor-zoom-in"
          >
            <img
              src={it.image_url}
              alt={it.title || ""}
              loading="lazy"
              decoding="async"
              className="size-full object-cover group-hover:scale-105 transition duration-500"
            />
            {(it.title || it.caption) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                {it.title && <div className="text-[11px] text-white font-bold truncate text-right">{it.title}</div>}
                {it.caption && <div className="text-[10px] text-white/80 truncate text-right">{it.caption}</div>}
              </div>
            )}
          </button>
        ))}
      </div>
      {openAt !== null && (
        <ImageLightbox images={urls} startIndex={openAt} onClose={() => setOpenAt(null)} />
      )}
    </section>
  );
}

/* ──────────────── Contact ──────────────── */

function Contact({ owner }: any) {
  const links = (owner.social_links as any) || {};
  const hasAny = owner.phone || Object.values(links).some((v) => v && String(v).trim());
  if (!hasAny) return null;
  return (
    <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
      <h2 className="text-xl font-bold bk-text-primary mb-4">تواصل معنا</h2>
      <div className="flex flex-wrap gap-2">
        {owner.phone && (
          <a href={`tel:${owner.phone}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/60 font-bold text-sm bk-text-primary hover:bg-secondary">
            <Phone className="size-4" /> {owner.phone}
          </a>
        )}
        {links.whatsapp && (
          <a href={`https://wa.me/${String(links.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-100 text-green-800 font-bold text-sm hover:bg-green-200">
            <MessageCircle className="size-4" /> واتساب
          </a>
        )}
        {links.instagram && <SocialBtn href={links.instagram} icon={Instagram} label="انستغرام" />}
        {links.tiktok && <SocialBtn href={links.tiktok} icon={Music2} label="تيك توك" />}
        {links.twitter && <SocialBtn href={links.twitter} icon={Twitter} label="تويتر" />}
        {links.facebook && <SocialBtn href={links.facebook} icon={Facebook} label="فيسبوك" />}
        {links.snapchat && <SocialBtn href={links.snapchat} icon={MessageCircle} label="سناب شات" />}
      </div>
    </section>
  );
}

function SocialBtn({ href, icon: Icon, label }: any) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/60 font-bold text-sm bk-text-primary hover:bg-secondary">
      <Icon className="size-4" /> {label}
    </a>
  );
}

/* ──────────────── Bottom CTA ──────────────── */

function BigCTA({ slug }: { slug: string }) {
  return (
    <section className="bk-primary rounded-2xl border bk-border-gold p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
      <div className="absolute inset-3 border border-white/10 rounded-xl pointer-events-none" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,var(--bk-gold),transparent_60%)]" />
      <div className="relative">
        <CalendarDays className="size-12 mx-auto bk-text-gold mb-3" />
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">جاهز لحجز مناسبتك؟</h2>
        <p className="text-sm sm:text-base opacity-90 mb-6 max-w-md mx-auto">
          إتمام الحجز في أقل من دقيقتين. تجربة سلسة من البداية للنهاية.
        </p>
        <Link
          to="/munasabti-booking/$slug/request"
          params={{ slug }}
          className="bk-gold inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base shadow-2xl hover:scale-[1.03] active:scale-95 transition"
        >
          <ShoppingBag className="size-5" /> ابدأ الحجز
        </Link>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto mt-8 text-right">
          <Mini n="1" t="اختر التاريخ" />
          <Mini n="2" t="اختر العناصر" />
          <Mini n="3" t="أرسل الطلب" />
        </div>
      </div>
    </section>
  );
}

function Mini({ n, t }: { n: string; t: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
      <div className="size-7 mx-auto rounded-full bk-gold flex items-center justify-center font-bold text-xs mb-1.5">{n}</div>
      <div className="text-xs font-bold">{t}</div>
    </div>
  );
}
