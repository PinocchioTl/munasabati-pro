import { createFileRoute, useParams, useSearch, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getAvailableForDate,
  getPublicOwner,
  submitBookingRequest,
} from "@/lib/booking-public.functions";
import {
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Minus, Plus,
  Send, ShoppingBag, Sparkles, Package, User, ClipboardList, Phone, MapPin,
  ZoomIn, FileText, CakeSlice, Gem, GraduationCap, PartyPopper, HeartHandshake,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LiveSummary, type SummaryItem } from "@/components/booking/LiveSummary";
import { ImageLightbox } from "@/components/booking/ImageLightbox";
import { formatDateLong, formatDateTime } from "@/lib/date-format";

export const Route = createFileRoute("/munasabti-booking/$slug/request")({
  validateSearch: (s) => ({
    decoration: typeof s.decoration === "string" ? s.decoration : undefined,
    date: typeof s.date === "string" ? s.date : undefined,
  }),
  component: RequestPage,
});

const EVENT_TYPES = [
  { value: "wedding", label: "عرس", icon: Gem },
  { value: "engagement", label: "خطوبة", icon: HeartHandshake },
  { value: "birthday", label: "عيد ميلاد", icon: CakeSlice },
  { value: "graduation", label: "حفل تخرج", icon: GraduationCap },
  { value: "other", label: "مناسبة أخرى", icon: PartyPopper },
];

type StepKey = "date" | "event" | "decorations" | "supplies" | "info" | "review";
const STEPS: { key: StepKey; label: string; icon: any }[] = [
  { key: "date", label: "التاريخ", icon: CalendarDays },
  { key: "event", label: "نوع المناسبة", icon: PartyPopper },
  { key: "decorations", label: "الديكورات", icon: Sparkles },
  { key: "supplies", label: "المستلزمات", icon: Package },
  { key: "info", label: "بياناتك", icon: User },
  { key: "review", label: "المراجعة", icon: ClipboardList },
];

function RequestPage() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const search = useSearch({ strict: false }) as { decoration?: string; date?: string };

  const { data: owner } = useQuery({
    queryKey: ["public-owner", slug],
    queryFn: () => getPublicOwner({ data: { slug } }),
    retry: false,
  });

  const [step, setStep] = useState<StepKey>("date");
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    event_date: search.date || "",
    event_type: "wedding",
    location: "",
    notes: "",
  });
  const [decQty, setDecQty] = useState<Record<string, number>>({});
  const [supQty, setSupQty] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string; at: string } | null>(null);

  const { data: avail, isFetching: loadingItems } = useQuery({
    queryKey: ["public-available", slug, form.event_date],
    queryFn: () => getAvailableForDate({ data: { slug, date: form.event_date } }),
    enabled: !!form.event_date,
    retry: false,
  });
  const decorations = avail?.decorations ?? [];
  const supplies = avail?.supplies ?? [];

  useEffect(() => {
    if (search.decoration) {
      const decorationId = search.decoration;
      setDecQty(q => ({ ...q, [decorationId]: q[decorationId] || 1 }));
    }
  }, [search.decoration]);

  const showPrices = owner?.show_prices ?? true;
  const stepIdx = STEPS.findIndex(s => s.key === step);

  const selectedDecorations = useMemo(
    () => Object.entries(decQty).filter(([, q]) => q > 0).map(([id, qty]) => ({ id, qty })),
    [decQty],
  );
  const selectedSupplies = useMemo(
    () => Object.entries(supQty).filter(([, q]) => q > 0).map(([id, qty]) => ({ id, qty })),
    [supQty],
  );

  const summaryDecorations: SummaryItem[] = useMemo(
    () => selectedDecorations.map(x => {
      const d: any = decorations.find((d: any) => d.id === x.id);
      return { id: x.id, name: d?.name ?? "—", qty: x.qty, unitPrice: d?.price };
    }),
    [selectedDecorations, decorations],
  );
  const summarySupplies: SummaryItem[] = useMemo(
    () => selectedSupplies.map(x => {
      const s: any = supplies.find((d: any) => d.id === x.id);
      return { id: x.id, name: s?.name ?? "—", qty: x.qty, unitPrice: s?.cost };
    }),
    [selectedSupplies, supplies],
  );

  const total = useMemo(() => {
    const d = summaryDecorations.reduce((s, x) => s + (x.unitPrice || 0) * x.qty, 0);
    const su = summarySupplies.reduce((s, x) => s + (x.unitPrice || 0) * x.qty, 0);
    return d + su;
  }, [summaryDecorations, summarySupplies]);

  function goNext() {
    if (step === "date") {
      if (!form.event_date) return toast.error("اختر تاريخ المناسبة أولاً");
      setStep("event");
    } else if (step === "event") {
      if (!form.event_type) return toast.error("اختر نوع المناسبة");
      setStep("decorations");
    } else if (step === "decorations") {
      setStep("supplies");
    } else if (step === "supplies") {
      if (selectedDecorations.length === 0 && selectedSupplies.length === 0)
        return toast.error("اختر ديكور أو مستلزم واحد على الأقل");
      setStep("info");
    } else if (step === "info") {
      if (!form.customer_name.trim()) return toast.error("الاسم الكامل مطلوب");
      if (!form.customer_phone.trim()) return toast.error("رقم الهاتف مطلوب");
      if (!form.location.trim()) return toast.error("الموقع مطلوب");
      setStep("review");
    }
  }
  function goBack() {
    const i = STEPS.findIndex(s => s.key === step);
    if (i > 0) setStep(STEPS[i - 1].key);
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await submitBookingRequest({ data: {
        slug,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        event_date: form.event_date,
        event_type: form.event_type,
        event_location: form.location || null,
        notes: form.notes || null,
        decorations: selectedDecorations,
        supplies: selectedSupplies,
      } as any });
      setResult({ id: (res as any).id, at: formatDateTime(new Date()) });
    } catch (err: any) {
      toast.error(err.message || "فشل إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl text-center mt-8">
        <div className="size-20 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-5 ring-8 ring-green-50">
          <CheckCircle2 className="size-10" />
        </div>
        <h1 className="text-2xl font-bold bk-text-primary">تم إرسال طلب الحجز بنجاح ✅</h1>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          سيتم التواصل معك بعد مراجعة الطلب من قبل صاحب الديكور.
        </p>
        <div className="mt-6 bg-[var(--bk-bg)] rounded-2xl p-4 text-right space-y-2.5">
          <Row label="رقم الطلب" value={<span className="font-mono text-xs">#{result.id.slice(0, 8).toUpperCase()}</span>} />
          <Row label="تاريخ الإرسال" value={result.at} />
          <Row label="تاريخ المناسبة" value={formatDateLong(form.event_date)} />
          <Row label="الحالة" value={<span className="text-amber-600 font-bold">قيد الانتظار</span>} />
        </div>
        <Link to="/munasabti-booking/$slug" params={{ slug }}
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bk-gold font-bold text-sm">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="flex-1 min-w-0 space-y-5">
        {/* Stepper */}
        <header className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold bk-text-gold">الخطوة {stepIdx + 1} من {STEPS.length}</span>
            <span className="text-[11px] text-gray-400">{STEPS[stepIdx]?.label}</span>
          </div>
          <div className="overflow-x-auto scrollbar-none pb-1">
          <div className="flex items-center gap-2 min-w-[640px]">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === stepIdx;
              const done = i < stepIdx;
              return (
                <div key={s.key} className="flex-1 flex items-center gap-1 sm:gap-2 min-w-0">
                  <div className={`size-8 sm:size-9 rounded-full flex items-center justify-center shrink-0 transition ${
                    done ? "bg-green-500 text-white" : active ? "bk-gold scale-110 ring-4 ring-[var(--bk-gold)]/20" : "bg-gray-100 text-gray-400"
                  }`}>
                    {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                  </div>
                  <div className={`text-[10px] sm:text-xs font-bold truncate hidden sm:block ${active ? "bk-text-primary" : "text-gray-400"}`}>
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 transition ${done ? "bg-green-500" : "bg-gray-100"}`} />}
                </div>
              );
            })}
          </div></div>
        </header>

        {/* Step content */}
        {step === "date" && <StepDate form={form} setForm={setForm} showEventType={false} />}
        {step === "event" && <StepDate form={form} setForm={setForm} showDate={false} />}

        {step === "decorations" && (
          <StepItems
            kind="decoration"
            loading={loadingItems}
            items={decorations}
            qty={decQty}
            setQty={setDecQty}
            showPrices={showPrices}
            date={form.event_date}
          />
        )}

        {step === "supplies" && (
          <StepItems
            kind="supply"
            loading={loadingItems}
            items={supplies}
            qty={supQty}
            setQty={setSupQty}
            showPrices={showPrices}
            date={form.event_date}
          />
        )}

        {step === "info" && <StepInfo form={form} setForm={setForm} />}

        {step === "review" && (
          <StepReview
            form={form}
            decorations={summaryDecorations}
            supplies={summarySupplies}
            total={total}
            showPrices={showPrices}
          />
        )}

        {/* Footer nav */}
        <div className="sticky bottom-[68px] lg:bottom-3 z-20 bg-white rounded-2xl p-3 shadow-2xl border bk-border-gold flex items-center justify-between gap-2">
          <button type="button" onClick={goBack} disabled={stepIdx === 0}
            className="inline-flex items-center gap-1 px-4 py-3 rounded-xl bg-gray-100 text-sm font-bold disabled:opacity-40">
            <ChevronRight className="size-4" /> السابق
          </button>

          {step === "review" ? (
            <button type="button" onClick={submit} disabled={submitting}
              className="bk-gold inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-lg disabled:opacity-60">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              إرسال طلب الحجز
            </button>
          ) : (
            <button type="button" onClick={goNext}
              className="bk-gold inline-flex items-center gap-1 px-6 py-3 rounded-xl font-bold text-sm shadow-lg">
              التالي <ChevronLeft className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live summary */}
      <LiveSummary
        date={form.event_date}
        decorations={summaryDecorations}
        supplies={summarySupplies}
        total={total}
        showPrices={showPrices}
      />
    </div>
  );
}

/* ──────────────── Step components ──────────────── */

function StepDate({ form, setForm, showDate = true, showEventType = true }: any) {
  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in">
      <SectionTitle icon={<CalendarDays className="size-5 bk-text-gold" />} title="متى ستقام مناسبتك؟" />
      <p className="text-xs text-gray-500 -mt-3">
        نعرض لك فقط الديكورات والمستلزمات المتوفرة في التاريخ الذي تختاره.
      </p>
      {showDate && (
      <Field label="تاريخ المناسبة *" icon={<CalendarDays className="size-3.5" />}>
        <input
          required
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={form.event_date}
          onChange={e => setForm({ ...form, event_date: e.target.value })}
          className={inputCls + " text-base py-3.5"}
        />
      </Field>
      )}
      {showEventType && (
      <Field label="نوع المناسبة *">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {EVENT_TYPES.map(t => {
            const EventIcon = t.icon;
            return (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm({ ...form, event_type: t.value })}
              className={`p-4 rounded-xl border-2 text-sm font-bold transition flex flex-col items-center gap-1.5 ${
                form.event_type === t.value
                  ? "bk-border-gold bg-[color-mix(in_oklab,var(--bk-gold)_12%,transparent)] bk-text-primary scale-[1.02]"
                  : "border-gray-100 hover:border-gray-200 text-gray-600"
              }`}
            >
              <EventIcon className="size-7 bk-text-gold" strokeWidth={1.6} />
              {t.label}
            </button>
          )})}
        </div>
      </Field>
      )}
    </section>
  );
}

function StepItems({
  kind, loading, items, qty, setQty, showPrices, date,
}: {
  kind: "decoration" | "supply";
  loading: boolean;
  items: any[];
  qty: Record<string, number>;
  setQty: (q: Record<string, number>) => void;
  showPrices: boolean;
  date: string;
}) {
  const [lightbox, setLightbox] = useState<{ urls: string[]; idx: number } | null>(null);
  const title = kind === "decoration" ? "اختر الديكورات" : "اختر المستلزمات";
  const Icon = kind === "decoration" ? Sparkles : Package;
  const priceField = kind === "decoration" ? "price" : "cost";

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-16 shadow-sm flex justify-center">
        <Loader2 className="size-7 animate-spin bk-text-gold" />
      </div>
    );
  }

  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle icon={<Icon className="size-5 bk-text-gold" />} title={title} />
        <span className="text-[11px] text-gray-400">متوفر في {date}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500">
          {kind === "decoration"
            ? "لا توجد ديكورات متاحة في هذا التاريخ. يمكنك المتابعة لاختيار المستلزمات."
            : "لا توجد مستلزمات متاحة في هذا التاريخ."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((it: any) => (
            <ItemCard
              key={it.id}
              item={it}
              qty={qty[it.id] || 0}
              onQty={(v) => setQty({ ...qty, [it.id]: v })}
              price={showPrices ? it[priceField] : undefined}
              onOpenImages={(urls, idx) => setLightbox({ urls, idx })}
            />
          ))}
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          images={lightbox.urls}
          startIndex={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}

function ItemCard({
  item, qty, onQty, price, onOpenImages,
}: {
  item: any;
  qty: number;
  onQty: (v: number) => void;
  price?: number;
  onOpenImages: (urls: string[], idx: number) => void;
}) {
  const max = item.available || 1;
  const images: string[] = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
  const cover = images[0];

  return (
    <div className={`rounded-2xl border-2 overflow-hidden bg-white transition ${
      qty > 0 ? "bk-border-gold shadow-md" : "border-gray-100"
    }`}>
      <button
        type="button"
        onClick={() => images.length > 0 && onOpenImages(images, 0)}
        className="relative w-full aspect-[4/3] bg-[linear-gradient(135deg,var(--bk-plum),color-mix(in_oklab,var(--bk-gold-soft)_55%,var(--bk-plum)))] group cursor-zoom-in overflow-hidden"
        disabled={images.length === 0}
      >
        {cover ? (
          <img src={cover} alt={item.name} loading="lazy" decoding="async"
            className="size-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="size-full flex flex-col items-center justify-center text-[#F5F0E6] gap-2">
            <span className="size-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur">
              <Sparkles className="size-7 bk-text-gold" />
            </span>
            <span className="text-xs font-bold">الصورة قريباً</span>
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/50 backdrop-blur text-white text-[10px] font-bold flex items-center gap-1">
            <ZoomIn className="size-3" /> {images.length}
          </div>
        )}
        {item.category && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[color-mix(in_oklab,var(--bk-primary)_72%,transparent)] backdrop-blur text-white border border-white/20">
            {item.category}
          </span>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[color-mix(in_oklab,var(--bk-primary)_72%,transparent)] backdrop-blur text-white border border-white/20">
          متاح: {item.available}
        </span>
      </button>

      <div className="p-4 space-y-2.5 bg-[color-mix(in_oklab,var(--bk-plum)_84%,transparent)] border-t border-[color-mix(in_oklab,var(--bk-gold)_18%,transparent)]">
        <div className="font-bold text-sm bk-text-primary truncate">{item.name}</div>
        {(item.description || item.notes) && (
          <p className="text-[11px] text-gray-500 line-clamp-2">{item.description || item.notes}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          {price !== undefined && price > 0 ? (
            <span className="text-sm font-bold bk-text-gold">
              {new Intl.NumberFormat("ar-DZ").format(price)} د.ج
            </span>
          ) : <span />}

          {qty === 0 ? (
            <button
              type="button"
              onClick={() => onQty(1)}
              className="bk-gold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              <Plus className="size-3.5" /> اختر
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onQty(Math.max(0, qty - 1))}
                className="size-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Minus className="size-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button type="button" onClick={() => onQty(Math.min(max, qty + 1))} disabled={qty >= max}
                className="size-8 rounded-lg bk-gold flex items-center justify-center disabled:opacity-40">
                <Plus className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepInfo({ form, setForm }: any) {
  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in">
      <SectionTitle icon={<User className="size-5 bk-text-gold" />} title="معلومات التواصل" />
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="الاسم الكامل *" icon={<User className="size-3.5" />}>
          <input required value={form.customer_name}
            onChange={e => setForm({ ...form, customer_name: e.target.value })}
            className={inputCls} placeholder="مثال: أحمد محمد" />
        </Field>
        <Field label="رقم الهاتف *" icon={<Phone className="size-3.5" />}>
          <input required type="tel" value={form.customer_phone}
            onChange={e => setForm({ ...form, customer_phone: e.target.value })}
            placeholder="0555 12 34 56" className={inputCls} />
        </Field>
      </div>
      <Field label="الموقع *" icon={<MapPin className="size-3.5" />}>
        <input required value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
          placeholder="مكان إقامة المناسبة (المدينة، الحي، العنوان...)" className={inputCls} />
      </Field>
      <Field label="ملاحظات إضافية (اختياري)" icon={<FileText className="size-3.5" />}>
        <textarea rows={3} value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          className={inputCls + " resize-none"} placeholder="أي تفاصيل إضافية تريد إخبارنا بها..." />
      </Field>
    </section>
  );
}

function StepReview({
  form, decorations, supplies, total, showPrices,
}: {
  form: any;
  decorations: SummaryItem[];
  supplies: SummaryItem[];
  total: number;
  showPrices: boolean;
}) {
  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in">
      <SectionTitle icon={<ClipboardList className="size-5 bk-text-gold" />} title="مراجعة الطلب" />

      <div className="bg-[var(--bk-bg)] rounded-xl p-4 space-y-2">
        <Row label="تاريخ المناسبة" value={formatDateLong(form.event_date)} />
        <Row label="نوع المناسبة" value={EVENT_TYPES.find(t => t.value === form.event_type)?.label || "—"} />
        <Row label="الاسم" value={form.customer_name} />
        <Row label="الهاتف" value={form.customer_phone} />
        <Row label="الموقع" value={form.location} />
        {form.notes && <Row label="ملاحظات" value={<span className="text-xs">{form.notes}</span>} />}
      </div>

      {decorations.length > 0 && (
        <ReviewGroup title="الديكورات" items={decorations} showPrices={showPrices} />
      )}
      {supplies.length > 0 && (
        <ReviewGroup title="المستلزمات" items={supplies} showPrices={showPrices} />
      )}

      {showPrices && (
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm font-bold bk-text-primary">الإجمالي التقريبي</span>
          <span className="text-lg font-bold bk-text-gold">
            {new Intl.NumberFormat("ar-DZ").format(total)} د.ج
          </span>
        </div>
      )}
    </section>
  );
}

function ReviewGroup({ title, items, showPrices }: { title: string; items: SummaryItem[]; showPrices: boolean }) {
  return (
    <div>
      <h3 className="text-xs font-bold bk-text-primary mb-2">{title}</h3>
      <div className="space-y-1.5">
        {items.map(it => (
          <div key={it.id} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2">
            <span className="truncate">{it.name} <span className="text-gray-400">× {it.qty}</span></span>
            {showPrices && it.unitPrice !== undefined && (
              <span className="bk-text-gold font-bold text-xs">
                {new Intl.NumberFormat("ar-DZ").format(it.unitPrice * it.qty)} د.ج
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────── Atoms ──────────────── */

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--bk-gold)] focus:ring-2 focus:ring-[var(--bk-gold)]/20 transition";

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <h2 className="font-bold bk-text-primary text-base sm:text-lg flex items-center gap-2">{icon} {title}</h2>;
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold bk-text-primary mb-1.5">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm gap-3">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="font-bold bk-text-primary text-left">{value || "—"}</span>
    </div>
  );
}
