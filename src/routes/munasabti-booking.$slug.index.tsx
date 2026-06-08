import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPublicOwner, getPublicGallery, getPublicDecorations, getPublicSupplies } from "@/lib/booking-public.functions";
import {
  Sparkles, ShoppingBag, CheckCircle2, Package, Phone, Instagram, Twitter,
  MessageCircle, Music2, Facebook,
} from "lucide-react";

export const Route = createFileRoute("/munasabti-booking/$slug/")({
  component: Landing,
});

type SectionId = "hero" | "about" | "gallery" | "decorations" | "supplies" | "contact";

function Landing() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const { data: owner } = useQuery({
    queryKey: ["public-owner", slug],
    queryFn: () => getPublicOwner({ data: { slug } }),
    retry: false,
  });

  const sections: { id: SectionId; visible: boolean }[] = Array.isArray((owner as any)?.sections_config)
    ? (owner as any).sections_config
    : [
        { id: "hero", visible: true }, { id: "about", visible: true }, { id: "gallery", visible: true },
        { id: "decorations", visible: true }, { id: "supplies", visible: true }, { id: "contact", visible: true },
      ];

  if (!owner) return null;

  return (
    <div className="space-y-8">
      {sections.filter((s) => s.visible).map((s) => {
        switch (s.id) {
          case "hero": return <HeroSection key="hero" owner={owner} slug={slug} />;
          case "about": return <AboutSection key="about" owner={owner} />;
          case "gallery": return <GallerySection key="gallery" slug={slug} />;
          case "decorations": return <DecorationsPreview key="decorations" slug={slug} showPrices={owner.show_prices} />;
          case "supplies": return <SuppliesPreview key="supplies" slug={slug} showPrices={owner.show_prices} />;
          case "contact": return <ContactSection key="contact" owner={owner} />;
          default: return null;
        }
      })}
    </div>
  );
}

function HeroSection({ owner, slug }: any) {
  const title = owner.hero_title?.trim() || owner.company_name || "نظم مناسبتك معنا";
  const subtitle = owner.hero_subtitle?.trim() || owner.tagline;
  const description = owner.hero_description?.trim();
  return (
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
            <h1 className="text-2xl sm:text-4xl font-bold drop-shadow">{title}</h1>
            {subtitle && <p className="text-sm sm:text-base opacity-90 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link to={"/munasabti-booking/$slug/request" as any} params={{ slug } as any}
            className="bk-gold inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] transition">
            <ShoppingBag className="size-5" /> ابدأ الحجز
          </Link>
        </div>
        {description && <p className="text-xs sm:text-sm opacity-90 mt-3 max-w-2xl">{description}</p>}
      </div>
    </section>
  );
}

function AboutSection({ owner }: any) {
  if (!owner.description) return null;
  return (
    <section className="bg-white rounded-2xl p-6 shadow-md">
      <h2 className="text-lg font-bold bk-text-primary mb-3 flex items-center gap-2">
        <Sparkles className="size-4 bk-text-gold" /> من نحن
      </h2>
      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{owner.description}</p>
    </section>
  );
}

function GallerySection({ slug }: { slug: string }) {
  const { data: items = [] } = useQuery({
    queryKey: ["public-gallery", slug],
    queryFn: () => getPublicGallery({ data: { slug } }),
  });
  if (items.length === 0) return null;
  return (
    <section className="bg-white rounded-2xl p-6 shadow-md">
      <h2 className="text-lg font-bold bk-text-primary mb-4">معرض أعمالنا</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {items.map((it: any) => (
          <div key={it.id} className="group aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
            <img src={it.image_url} alt={it.title || ""} loading="lazy" className="size-full object-cover group-hover:scale-105 transition" />
            {(it.title || it.caption) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                {it.title && <div className="text-[11px] text-white font-bold truncate">{it.title}</div>}
                {it.caption && <div className="text-[10px] text-white/80 truncate">{it.caption}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function DecorationsPreview({ slug, showPrices }: { slug: string; showPrices: boolean }) {
  const { data: items = [] } = useQuery({
    queryKey: ["public-decorations", slug],
    queryFn: () => getPublicDecorations({ data: { slug } }),
  });
  if (items.length === 0) return null;
  const preview = items.slice(0, 6);
  return (
    <section className="bg-white rounded-2xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold bk-text-primary flex items-center gap-2">
          <Sparkles className="size-4 bk-text-gold" /> ديكوراتنا
        </h2>
        <Link to="/munasabti-booking/$slug/decorations" params={{ slug }} className="text-xs font-bold bk-text-primary hover:underline">
          عرض الكل ←
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {preview.map((d: any) => (
          <Link key={d.id} to={"/munasabti-booking/$slug/decorations/$id" as any} params={{ slug, id: d.id } as any}
            className="block rounded-xl overflow-hidden border bg-white hover:shadow-md transition">
            <div className="aspect-square bg-gray-100">
              {d.images?.[0] && <img src={d.images[0]} alt={d.name} className="size-full object-cover" loading="lazy" />}
            </div>
            <div className="p-2">
              <div className="font-bold text-xs bk-text-primary truncate">{d.name}</div>
              {showPrices && d.price > 0 && <div className="text-[11px] bk-text-gold font-bold">{d.price} ر.س</div>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SuppliesPreview({ slug, showPrices }: { slug: string; showPrices: boolean }) {
  const { data: items = [] } = useQuery({
    queryKey: ["public-supplies", slug],
    queryFn: () => getPublicSupplies({ data: { slug } }),
  });
  if (items.length === 0) return null;
  const preview = items.slice(0, 6);
  return (
    <section className="bg-white rounded-2xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold bk-text-primary flex items-center gap-2">
          <Package className="size-4 bk-text-gold" /> المستلزمات
        </h2>
        <Link to="/munasabti-booking/$slug/supplies" params={{ slug }} className="text-xs font-bold bk-text-primary hover:underline">
          عرض الكل ←
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {preview.map((s: any) => (
          <div key={s.id} className="rounded-xl overflow-hidden border bg-white">
            <div className="aspect-square bg-gray-100">
              {s.images?.[0] && <img src={s.images[0]} alt={s.name} className="size-full object-cover" loading="lazy" />}
            </div>
            <div className="p-2">
              <div className="font-bold text-xs bk-text-primary truncate">{s.name}</div>
              {showPrices && s.cost > 0 && <div className="text-[11px] bk-text-gold font-bold">{s.cost} ر.س</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactSection({ owner }: any) {
  const links = (owner.social_links as any) || {};
  const hasAny = owner.phone || Object.values(links).some((v) => v && String(v).trim());
  if (!hasAny) {
    return (
      <section className="bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-lg font-bold bk-text-primary mb-4">كيف يعمل الحجز؟</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Step n={1} title="اختر التاريخ" desc="حدد تاريخ مناسبتك أولاً" />
          <Step n={2} title="اختر الديكورات" desc="من بين العناصر المتوفرة" />
          <Step n={3} title="أرسل الطلب" desc="سنتواصل معك للتأكيد" />
        </div>
      </section>
    );
  }
  return (
    <section className="bg-white rounded-2xl p-6 shadow-md">
      <h2 className="text-lg font-bold bk-text-primary mb-4">تواصل معنا</h2>
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

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="bg-[var(--bk-bg)] rounded-2xl p-4">
      <div className="size-10 rounded-xl bk-gold flex items-center justify-center font-bold mb-2">{n}</div>
      <div className="font-bold bk-text-primary">{title}</div>
      <div className="text-xs text-gray-600 mt-1">{desc}</div>
    </div>
  );
}

// Inject input class used by tabs (no-op import side effect since module is also imported elsewhere)
