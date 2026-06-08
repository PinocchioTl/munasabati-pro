import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Palette, Image as ImageIcon, Type, Layout, Eye, Save, Loader2, Upload,
  GripVertical, EyeOff, Plus, Trash2, Check, ExternalLink, Pencil,
  Instagram, Twitter, MessageCircle, Music2, Facebook, Phone, Link2,
  AlertTriangle,
} from "lucide-react";
import { Card, Button } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  getMyBuilderConfig, saveMyBuilderConfig,
  listMyGallery, addGalleryImage, updateGalleryImage, deleteGalleryImage, reorderGallery,
} from "@/lib/booking-builder.functions";

export const Route = createFileRoute("/_main/munasabti-manager/booking-page-builder")({
  component: BuilderPage,
});

type Section = { id: "hero" | "about" | "gallery" | "decorations" | "supplies" | "contact"; visible: boolean };

const SECTION_LABELS: Record<Section["id"], string> = {
  hero: "الواجهة الرئيسية",
  about: "من نحن",
  gallery: "معرض الصور",
  decorations: "الديكورات",
  supplies: "المستلزمات",
  contact: "التواصل",
};

const DEFAULT_SECTIONS: Section[] = [
  { id: "hero", visible: true },
  { id: "about", visible: true },
  { id: "gallery", visible: true },
  { id: "decorations", visible: true },
  { id: "supplies", visible: true },
  { id: "contact", visible: true },
];

type TabId = "identity" | "colors" | "hero" | "sections" | "gallery" | "disabled";

const TABS: { id: TabId; label: string; icon: typeof Palette }[] = [
  { id: "identity", label: "الهوية", icon: ImageIcon },
  { id: "colors", label: "الألوان", icon: Palette },
  { id: "hero", label: "الصفحة الرئيسية", icon: Type },
  { id: "sections", label: "الأقسام", icon: Layout },
  { id: "gallery", label: "المعرض", icon: ImageIcon },
  { id: "disabled", label: "رسالة التعطيل", icon: EyeOff },
];

function BuilderPage() {
  const qc = useQueryClient();
  const getConfig = useServerFn(getMyBuilderConfig);
  const saveConfig = useServerFn(saveMyBuilderConfig);
  const [tab, setTab] = useState<TabId>("identity");

  const { data: config, isLoading } = useQuery({
    queryKey: ["builder-config"],
    queryFn: () => getConfig(),
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (config) {
      setForm({
        company_name: config.company_name ?? "",
        tagline: config.tagline ?? "",
        description: config.description ?? "",
        phone: config.phone ?? "",
        logo_url: config.logo_url ?? null,
        cover_url: config.cover_url ?? null,
        primary_color: config.primary_color ?? "#D4AF37",
        secondary_color: config.secondary_color ?? "#5D0A13",
        accent_color: config.accent_color ?? "#2563EB",
        background_color: config.background_color ?? "#FAF7F2",
        button_color: config.button_color ?? config.primary_color ?? "#D4AF37",
        hero_title: config.hero_title ?? "",
        hero_subtitle: config.hero_subtitle ?? "",
        hero_description: config.hero_description ?? "",
        disabled_message: config.disabled_message ?? "",
        booking_enabled: config.booking_enabled ?? true,
        show_prices: config.show_prices ?? true,
        social_links: (config.social_links as any) ?? {},
        sections_config: normalizeSections(config.sections_config),
      });
    }
  }, [config]);

  const saveMut = useMutation({
    mutationFn: () => saveConfig({ data: form }),
    onSuccess: () => {
      toast.success("تم نشر التغييرات على صفحة الحجز");
      qc.invalidateQueries({ queryKey: ["builder-config"] });
      qc.invalidateQueries({ queryKey: ["public-owner"] });
    },
    onError: (e: any) => toast.error(e.message ?? "فشل الحفظ"),
  });

  if (isLoading || !form) {
    return <Card className="p-12 text-center"><Loader2 className="size-6 animate-spin mx-auto" /></Card>;
  }

  const slug = config?.public_slug;
  const update = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));

  return (
    <div className="space-y-5">
      <Card className="p-5 lg:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl lg:text-2xl font-bold">تخصيص صفحة الحجز</h1>
          <p className="text-sm text-muted-foreground mt-1">
            صمّم صفحة <span className="font-bold text-foreground">/munasabti-booking/{slug || "..."}</span> كما تريد
          </p>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <a href={`/munasabti-booking/${slug}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="size-4" /> معاينة</Button>
            </a>
          )}
          <Button variant="gold" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            نشر التغييرات
          </Button>
        </div>
      </Card>

      {!slug && (
        <Card className="p-4 border-warning/50 bg-warning/5 flex items-start gap-3">
          <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            لم تختر رابط الحجز بعد. اذهب إلى <Link to="/munasabti-manager/settings" className="font-bold text-info underline">الإعدادات → رابط الحجز</Link> لتعيينه أولاً.
          </div>
        </Card>
      )}

      <Card className="p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                  active ? "bg-gradient-gold text-primary shadow-gold" : "hover:bg-secondary text-muted-foreground"
                }`}>
                <Icon className="size-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </Card>

      {tab === "identity" && <IdentityTab form={form} update={update} />}
      {tab === "colors" && <ColorsTab form={form} update={update} />}
      {tab === "hero" && <HeroTab form={form} update={update} />}
      {tab === "sections" && <SectionsTab form={form} update={update} />}
      {tab === "gallery" && <GalleryTab />}
      {tab === "disabled" && <DisabledTab form={form} update={update} />}
    </div>
  );
}

function normalizeSections(raw: any): Section[] {
  if (!Array.isArray(raw)) return DEFAULT_SECTIONS;
  const map = new Map(raw.map((s: any) => [s.id, !!s.visible]));
  const ordered: Section[] = raw
    .filter((s: any) => SECTION_LABELS[s.id as Section["id"]])
    .map((s: any) => ({ id: s.id, visible: !!s.visible }));
  for (const def of DEFAULT_SECTIONS) {
    if (!ordered.find((s) => s.id === def.id)) ordered.push({ id: def.id, visible: map.get(def.id) ?? true });
  }
  return ordered;
}

/* ---------------- Identity Tab ---------------- */
function IdentityTab({ form, update }: any) {
  const { user } = useAuth();
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  async function upload(file: File, kind: "logo" | "cover") {
    if (!user) return;
    if (file.size > 4 * 1024 * 1024) return toast.error("الحجم الأقصى 4MB");
    setUploading(kind);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      update(kind === "logo" ? { logo_url: data.publicUrl } : { cover_url: data.publicUrl });
      toast.success("تم الرفع");
    } catch (e: any) { toast.error(e.message); } finally { setUploading(null); }
  }

  return (
    <Card className="p-6 space-y-5">
      <Field label="اسم النشاط">
        <input value={form.company_name} onChange={(e) => update({ company_name: e.target.value })}
          className="input" placeholder="مثل: فخامة الديكور" />
      </Field>

      <Field label="شعار قصير (Tagline)">
        <input value={form.tagline} onChange={(e) => update({ tagline: e.target.value })}
          className="input" placeholder="نظم مناسبتك مع الفخامة" />
      </Field>

      <Field label="نبذة عن النشاط">
        <textarea value={form.description} onChange={(e) => update({ description: e.target.value })} rows={4}
          className="input resize-none" placeholder="اكتب وصفاً مختصراً عن نشاطك..." />
      </Field>

      <Field label="رقم الهاتف">
        <input value={form.phone} onChange={(e) => update({ phone: e.target.value })}
          className="input" placeholder="+966..." dir="ltr" />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="الشعار (Logo)">
          <div className="flex items-center gap-3">
            <div className="size-20 rounded-xl bg-secondary/60 border border-border overflow-hidden shrink-0 flex items-center justify-center">
              {form.logo_url ? <img src={form.logo_url} className="size-full object-contain" alt="" /> : <ImageIcon className="text-muted-foreground" />}
            </div>
            <div>
              <input ref={logoRef} type="file" accept="image/*" hidden
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "logo")} />
              <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={uploading === "logo"}>
                {uploading === "logo" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                رفع شعار
              </Button>
              {form.logo_url && <button onClick={() => update({ logo_url: null })} className="block mt-2 text-xs text-destructive">إزالة</button>}
            </div>
          </div>
        </Field>

        <Field label="صورة الغلاف">
          <div className="flex items-center gap-3">
            <div className="w-32 aspect-video rounded-xl bg-secondary/60 border border-border overflow-hidden shrink-0">
              {form.cover_url ? <img src={form.cover_url} className="size-full object-cover" alt="" /> : null}
            </div>
            <div>
              <input ref={coverRef} type="file" accept="image/*" hidden
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} />
              <Button variant="outline" size="sm" onClick={() => coverRef.current?.click()} disabled={uploading === "cover"}>
                {uploading === "cover" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                رفع الغلاف
              </Button>
              {form.cover_url && <button onClick={() => update({ cover_url: null })} className="block mt-2 text-xs text-destructive">إزالة</button>}
            </div>
          </div>
        </Field>
      </div>

      <div className="pt-4 border-t border-border/60 space-y-3">
        <div className="text-sm font-bold">روابط التواصل الاجتماعي</div>
        <SocialField icon={Instagram} label="انستغرام" value={form.social_links.instagram || ""}
          onChange={(v: any) => update({ social_links: { ...form.social_links, instagram: v } })} placeholder="https://instagram.com/..." />
        <SocialField icon={Music2} label="تيك توك" value={form.social_links.tiktok || ""}
          onChange={(v: any) => update({ social_links: { ...form.social_links, tiktok: v } })} placeholder="https://tiktok.com/@..." />
        <SocialField icon={MessageCircle} label="سناب شات" value={form.social_links.snapchat || ""}
          onChange={(v: any) => update({ social_links: { ...form.social_links, snapchat: v } })} placeholder="https://snapchat.com/add/..." />
        <SocialField icon={Twitter} label="تويتر / X" value={form.social_links.twitter || ""}
          onChange={(v: any) => update({ social_links: { ...form.social_links, twitter: v } })} placeholder="https://x.com/..." />
        <SocialField icon={Facebook} label="فيسبوك" value={form.social_links.facebook || ""}
          onChange={(v: any) => update({ social_links: { ...form.social_links, facebook: v } })} placeholder="https://facebook.com/..." />
        <SocialField icon={Phone} label="واتساب (رقم)" value={form.social_links.whatsapp || ""}
          onChange={(v: any) => update({ social_links: { ...form.social_links, whatsapp: v } })} placeholder="966..." dir="ltr" />
      </div>
    </Card>
  );
}

function SocialField({ icon: Icon, label, value, onChange, placeholder, dir }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0"><Icon className="size-4" /></div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} dir={dir}
          className="input py-2 text-sm" />
      </div>
    </div>
  );
}

/* ---------------- Colors Tab ---------------- */
function ColorsTab({ form, update }: any) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card className="p-6 space-y-4">
        <div className="text-sm font-bold">ألوان الصفحة</div>
        <ColorRow label="اللون الرئيسي (الأزرار، الذهبي)" value={form.primary_color} onChange={(v: any) => update({ primary_color: v, button_color: v })} />
        <ColorRow label="اللون الثانوي (الهيدر، العنوان)" value={form.secondary_color} onChange={(v: any) => update({ secondary_color: v })} />
        <ColorRow label="لون الأزرار" value={form.button_color} onChange={(v: any) => update({ button_color: v })} />
        <ColorRow label="لون الخلفية" value={form.background_color} onChange={(v: any) => update({ background_color: v })} />
        <ColorRow label="لون التمييز" value={form.accent_color} onChange={(v: any) => update({ accent_color: v })} />
      </Card>
      <Card className="p-6">
        <div className="text-sm font-bold mb-3">معاينة مباشرة</div>
        <div className="rounded-2xl overflow-hidden border border-border" style={{ background: form.background_color }}>
          <div className="p-4" style={{ background: form.secondary_color, color: "white" }}>
            <div className="text-sm font-bold">{form.company_name || "اسم النشاط"}</div>
            <div className="text-[11px] opacity-80">{form.tagline || "شعار قصير"}</div>
          </div>
          <div className="p-5 space-y-3">
            <button className="px-4 py-2.5 rounded-xl font-bold text-sm shadow"
              style={{ background: form.button_color, color: form.secondary_color }}>زر الحجز</button>
            <div className="rounded-xl p-3 text-sm" style={{ background: "white", color: form.secondary_color }}>
              <div className="font-bold mb-1" style={{ color: form.secondary_color }}>عنوان قسم</div>
              <div className="text-xs text-gray-600">نص توضيحي للقسم بألوان الصفحة الحالية.</div>
              <div className="mt-2 text-xs font-bold" style={{ color: form.primary_color }}>نص بارز</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="size-12 rounded-xl border border-border cursor-pointer shrink-0" />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <input value={value} onChange={(e) => onChange(e.target.value)} dir="ltr"
          className="input py-2 text-sm font-mono" />
      </div>
    </div>
  );
}

/* ---------------- Hero Tab ---------------- */
function HeroTab({ form, update }: any) {
  return (
    <Card className="p-6 space-y-5">
      <div className="text-sm text-muted-foreground">يظهر هذا المحتوى في أعلى صفحة الحجز. اتركه فارغاً لاستخدام الافتراضي.</div>
      <Field label="العنوان الرئيسي">
        <input value={form.hero_title} onChange={(e) => update({ hero_title: e.target.value })}
          className="input" placeholder={form.company_name || "نظم مناسبتك معنا"} />
      </Field>
      <Field label="النص الترحيبي (Subtitle)">
        <input value={form.hero_subtitle} onChange={(e) => update({ hero_subtitle: e.target.value })}
          className="input" placeholder={form.tagline || "ديكورات احترافية لجميع المناسبات"} />
      </Field>
      <Field label="وصف الخدمة">
        <textarea value={form.hero_description} onChange={(e) => update({ hero_description: e.target.value })} rows={3}
          className="input resize-none" placeholder="اختر تاريخ مناسبتك أولاً لعرض الديكورات والمستلزمات المتوفرة" />
      </Field>
      <div className="pt-4 border-t border-border/60">
        <ToggleRow label="إظهار الأسعار" desc="عرض أسعار الديكورات والمستلزمات للعملاء"
          value={form.show_prices} onChange={(v: any) => update({ show_prices: v })} />
      </div>
    </Card>
  );
}

/* ---------------- Sections Tab ---------------- */
function SectionsTab({ form, update }: any) {
  const sections: Section[] = form.sections_config;
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function toggle(id: Section["id"]) {
    update({ sections_config: sections.map((s) => s.id === id ? { ...s, visible: !s.visible } : s) });
  }
  function move(from: number, to: number) {
    if (from === to) return;
    const next = sections.slice();
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    update({ sections_config: next });
  }

  return (
    <Card className="p-6">
      <div className="text-sm text-muted-foreground mb-4">اسحب الأقسام لإعادة ترتيبها، أو استخدم زر العين لإظهارها/إخفائها.</div>
      <div className="space-y-2">
        {sections.map((s, idx) => (
          <div key={s.id}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null) move(dragIdx, idx); setDragIdx(null); }}
            className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-move ${
              s.visible ? "bg-card border-border" : "bg-muted/30 border-dashed border-border/60 opacity-60"
            }`}>
            <GripVertical className="size-4 text-muted-foreground" />
            <div className="size-8 rounded-lg bg-gradient-gold text-primary text-xs font-bold flex items-center justify-center">
              {idx + 1}
            </div>
            <div className="flex-1 font-bold text-sm">{SECTION_LABELS[s.id]}</div>
            <button onClick={() => toggle(s.id)}
              className="size-9 rounded-lg hover:bg-secondary flex items-center justify-center transition">
              {s.visible ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted-foreground" />}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- Gallery Tab ---------------- */
function GalleryTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const list = useServerFn(listMyGallery);
  const add = useServerFn(addGalleryImage);
  const upd = useServerFn(updateGalleryImage);
  const del = useServerFn(deleteGalleryImage);
  const reorder = useServerFn(reorderGallery);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data: items = [] } = useQuery({ queryKey: ["my-gallery"], queryFn: () => list() });

  const addMut = useMutation({
    mutationFn: (image_url: string) => add({ data: { image_url, title: null, caption: null } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-gallery"] }); toast.success("تمت الإضافة"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updMut = useMutation({
    mutationFn: (d: any) => upd({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-gallery"] }); setEditing(null); toast.success("تم الحفظ"); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-gallery"] }); toast.success("تم الحذف"); },
  });
  const reorderMut = useMutation({
    mutationFn: (order: string[]) => reorder({ data: { order } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-gallery"] }),
  });

  async function uploadFiles(files: FileList) {
    if (!user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 4 * 1024 * 1024) { toast.error(`${file.name}: تجاوز 4MB`); continue; }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error } = await supabase.storage.from("branding").upload(path, file, { upsert: false });
        if (error) { toast.error(error.message); continue; }
        const { data } = supabase.storage.from("branding").getPublicUrl(path);
        await addMut.mutateAsync(data.publicUrl);
      }
    } finally { setUploading(false); }
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = items.map((i: any) => i.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = ids.slice();
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    reorderMut.mutate(next);
    setDragId(null);
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-bold">معرض الصور</div>
          <div className="text-xs text-muted-foreground">{items.length}/50 صورة — اسحب لإعادة الترتيب</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
        <Button variant="gold" onClick={() => fileRef.current?.click()} disabled={uploading || items.length >= 50}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          إضافة صور
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">لا توجد صور بعد. ابدأ بإضافة أعمالك السابقة.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it: any) => (
            <div key={it.id}
              draggable
              onDragStart={() => setDragId(it.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(it.id)}
              className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-secondary cursor-move">
              <img src={it.image_url} alt={it.title || ""} className="size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="text-[11px] text-white font-bold truncate">{it.title || "بدون عنوان"}</div>
              </div>
              <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => setEditing(it.id)}
                  className="size-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => { if (confirm("حذف هذه الصورة؟")) delMut.mutate(it.id); }}
                  className="size-7 rounded-lg bg-destructive/80 text-white flex items-center justify-center hover:bg-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {editing === it.id && (
                <GalleryEditDialog item={it} onClose={() => setEditing(null)}
                  onSave={(t: any, c: any) => updMut.mutate({ id: it.id, title: t, caption: c })} />
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function GalleryEditDialog({ item, onClose, onSave }: any) {
  const [t, setT] = useState(item.title || "");
  const [c, setC] = useState(item.caption || "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl p-5 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="font-bold">تعديل الصورة</div>
        <input value={t} onChange={(e) => setT(e.target.value)} placeholder="العنوان (اختياري)" className="input" />
        <textarea value={c} onChange={(e) => setC(e.target.value)} placeholder="الوصف (اختياري)" rows={3} className="input resize-none" />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
          <Button variant="gold" size="sm" onClick={() => onSave(t || null, c || null)}><Check className="size-4" /> حفظ</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Disabled Tab ---------------- */
function DisabledTab({ form, update }: any) {
  return (
    <Card className="p-6 space-y-5">
      <ToggleRow label="تفعيل استقبال الحجوزات" desc="عند الإيقاف، يرى الزوار رسالة بدلاً من نموذج الحجز"
        value={form.booking_enabled} onChange={(v: any) => update({ booking_enabled: v })} />

      <div className={form.booking_enabled ? "opacity-50 pointer-events-none" : ""}>
        <Field label="الرسالة المخصصة عند تعطيل الحجز">
          <textarea value={form.disabled_message} onChange={(e) => update({ disabled_message: e.target.value })} rows={4}
            className="input resize-none"
            placeholder="الحجوزات متوقفة حالياً وسيتم فتحها قريباً." />
        </Field>
        <p className="text-xs text-muted-foreground mt-2">ستظهر هذه الرسالة للعملاء عند زيارة صفحة الحجز.</p>
      </div>
    </Card>
  );
}

/* ---------------- Shared bits ---------------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-bold block mb-2">{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: any) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1">
        <div className="font-bold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-colors ${value ? "bg-gradient-gold shadow-gold" : "bg-secondary"}`}>
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow-md transition-all ${value ? "right-0.5" : "right-[1.375rem]"}`} />
      </button>
    </div>
  );
}
