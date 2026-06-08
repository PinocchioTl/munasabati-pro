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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/munasabti-booking/$slug/request")({
  validateSearch: (s) => ({
    decoration: typeof s.decoration === "string" ? s.decoration : undefined,
    date: typeof s.date === "string" ? s.date : undefined,
  }),
  component: RequestPage,
});

const EVENT_TYPES = [
  { value: "wedding", label: "عرس", emoji: "💍" },
  { value: "engagement", label: "خطوبة", emoji: "💐" },
  { value: "birthday", label: "عيد ميلاد", emoji: "🎂" },
  { value: "graduation", label: "حفل تخرج", emoji: "🎓" },
  { value: "other", label: "مناسبة أخرى", emoji: "🎉" },
];

type StepKey = "date" | "items" | "info" | "summary";
const STEPS: { key: StepKey; label: string; icon: any }[] = [
  { key: "date", label: "التاريخ", icon: CalendarDays },
  { key: "items", label: "الاختيارات", icon: Sparkles },
  { key: "info", label: "بياناتك", icon: User },
  { key: "summary", label: "الملخص", icon: ClipboardList },
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

  // Date-gated availability: only fetch once a date is chosen.
  const { data: avail, isFetching: loadingItems } = useQuery({
    queryKey: ["public-available", slug, form.event_date],
    queryFn: () => getAvailableForDate({ data: { slug, date: form.event_date } }),
    enabled: !!form.event_date,
    retry: false,
  });
  const decorations = avail?.decorations ?? [];
  const supplies = avail?.supplies ?? [];

  useEffect(() => {
    if (search.decoration) setDecQty(q => ({ ...q, [search.decoration!]: q[search.decoration!] || 1 }));
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

  const total = useMemo(() => {
    const d = selectedDecorations.reduce((s, x) => s + ((decorations.find(d => d.id === x.id)?.price) || 0) * x.qty, 0);
    const su = selectedSupplies.reduce((s, x) => s + ((supplies.find(d => d.id === x.id)?.cost) || 0) * x.qty, 0);
    return d + su;
  }, [selectedDecorations, selectedSupplies, decorations, supplies]);

  function goNext() {
    if (step === "date") {
      if (!form.event_date) return toast.error("اختر تاريخ المناسبة أولاً");
      if (!form.event_type) return toast.error("اختر نوع المناسبة");
      setStep("items");
    } else if (step === "items") {
      if (selectedDecorations.length === 0 && selectedSupplies.length === 0)
        return toast.error("اختر ديكور أو مستلزم واحد على الأقل");
      setStep("info");
    } else if (step === "info") {
      if (!form.customer_name.trim()) return toast.error("الاسم الكامل مطلوب");
      if (!form.customer_phone.trim()) return toast.error("رقم الهاتف مطلوب");
      if (!form.location.trim()) return toast.error("الموقع مطلوب");
      setStep("summary");
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
      setResult({ id: (res as any).id, at: new Date().toLocaleString("ar-DZ") });
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
          <Row label="تاريخ المناسبة" value={form.event_date} />
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
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header / Stepper */}
      <header className="bg-white rounded-2xl p-4 shadow-sm">
        <h1 className="text-xl font-bold bk-text-primary flex items-center gap-2">
          <ShoppingBag className="size-5 bk-text-gold" /> طلب حجز جديد
        </h1>
        <div className="mt-4 flex items-center gap-1 sm:gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === stepIdx;
            const done = i < stepIdx;
            return (
              <div key={s.key} className="flex-1 flex items-center gap-1 sm:gap-2 min-w-0">
                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 transition ${
                  done ? "bg-green-500 text-white" : active ? "bk-gold" : "bg-gray-100 text-gray-400"
                }`}>
                  {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                </div>
                <div className={`text-[11px] sm:text-xs font-bold truncate ${active ? "bk-text-primary" : "text-gray-400"}`}>
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${done ? "bg-green-500" : "bg-gray-100"}`} />}
              </div>
            );
          })}
        </div>
      </header>

      {/* Step content */}
      {step === "date" && (
        <section className="bg-white rounded-2xl p-5 shadow-sm space-y-5 animate-in fade-in">
          <SectionTitle icon={<CalendarDays className="size-4 bk-text-gold" />} title="متى ستقام مناسبتك؟" />
          <p className="text-xs text-gray-500 -mt-3">يجب اختيار تاريخ المناسبة أولاً لعرض الديكورات والمستلزمات المتوفرة في ذلك اليوم.</p>
          <Field label="تاريخ المناسبة *" icon={<CalendarDays className="size-3.5" />}>
            <input required type="date" min={new Date().toISOString().slice(0, 10)}
              value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })}
              className={inputCls} />
          </Field>
          <Field label="نوع المناسبة *">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EVENT_TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm({ ...form, event_type: t.value })}
                  className={`p-3 rounded-xl border-2 text-sm font-bold transition flex flex-col items-center gap-1 ${
                    form.event_type === t.value
                      ? "bk-border-gold bg-yellow-50/40 bk-text-primary"
                      : "border-gray-100 hover:border-gray-200 text-gray-600"
                  }`}>
                  <span className="text-xl">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
        </section>
      )}

      {step === "items" && (
        <div className="space-y-4 animate-in fade-in">
          {loadingItems ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm flex justify-center">
              <Loader2 className="size-6 animate-spin bk-text-gold" />
            </div>
          ) : decorations.length === 0 && supplies.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-sm text-gray-500">
              لا توجد عناصر متاحة في تاريخ <span className="font-bold bk-text-primary">{form.event_date}</span>.
              <br />جرّب تاريخاً آخر.
            </div>
          ) : null}

          {decorations.length > 0 && (
            <Section title="الديكورات المتاحة" icon={<Sparkles className="size-4 bk-text-gold" />}
              hint={`متوفر في ${form.event_date}`}>
              {decorations.map((d: any) => (
                <PickRow key={d.id}
                  image={d.images?.[0]}
                  name={d.name}
                  meta={d.category || undefined}
                  price={showPrices ? d.price : undefined}
                  qty={decQty[d.id] || 0}
                  onChange={(v) => setDecQty({ ...decQty, [d.id]: v })}
                  maxQty={d.available || 1}
                  availableLabel={`متاح: ${d.available}`}
                />
              ))}
            </Section>
          )}

          {supplies.length > 0 && (
            <Section title="المستلزمات المتاحة" icon={<Package className="size-4 bk-text-gold" />}>
              {supplies.map((s: any) => (
                <PickRow key={s.id}
                  image={s.images?.[0]}
                  name={s.name}
                  meta={s.category || undefined}
                  price={showPrices ? s.cost : undefined}
                  qty={supQty[s.id] || 0}
                  onChange={(v) => setSupQty({ ...supQty, [s.id]: v })}
                  maxQty={s.available || 1}
                  availableLabel={`متاح: ${s.available}`}
                />
              ))}
            </Section>
          )}
        </div>
      )}

      {step === "info" && (
        <section className="bg-white rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in">
          <SectionTitle icon={<User className="size-4 bk-text-gold" />} title="معلومات التواصل" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="الاسم الكامل *" icon={<User className="size-3.5" />}>
              <input required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}
                className={inputCls} />
            </Field>
            <Field label="رقم الهاتف *" icon={<Phone className="size-3.5" />}>
              <input required type="tel" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                placeholder="0555 12 34 56" className={inputCls} />
            </Field>
          </div>
          <Field label="الموقع *" icon={<MapPin className="size-3.5" />}>
            <input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="مكان إقامة المناسبة (المدينة، الحي، العنوان...)" className={inputCls} />
          </Field>
          <Field label="ملاحظات إضافية (اختياري)">
            <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className={inputCls + " resize-none"} />
          </Field>
        </section>
      )}

      {step === "summary" && (
        <section className="bg-white rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in">
          <SectionTitle icon={<ClipboardList className="size-4 bk-text-gold" />} title="مراجعة الطلب" />

          <div className="bg-[var(--bk-bg)] rounded-xl p-4 space-y-2">
            <Row label="تاريخ المناسبة" value={form.event_date} />
            <Row label="نوع المناسبة" value={EVENT_TYPES.find(t => t.value === form.event_type)?.label || "—"} />
            <Row label="الاسم" value={form.customer_name} />
            <Row label="الهاتف" value={form.customer_phone} />
            <Row label="الموقع" value={form.location} />
          </div>

          {selectedDecorations.length > 0 && (
            <div>
              <h3 className="text-xs font-bold bk-text-primary mb-2">الديكورات</h3>
              <div className="space-y-1.5">
                {selectedDecorations.map(x => {
                  const d: any = decorations.find((d: any) => d.id === x.id);
                  if (!d) return null;
                  return (
                    <div key={x.id} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2">
                      <span className="truncate">{d.name} <span className="text-gray-400">× {x.qty}</span></span>
                      {showPrices && <span className="bk-text-gold font-bold text-xs">
                        {new Intl.NumberFormat("ar-DZ").format((d.price || 0) * x.qty)} د.ج
                      </span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedSupplies.length > 0 && (
            <div>
              <h3 className="text-xs font-bold bk-text-primary mb-2">المستلزمات</h3>
              <div className="space-y-1.5">
                {selectedSupplies.map(x => {
                  const s: any = supplies.find((d: any) => d.id === x.id);
                  if (!s) return null;
                  return (
                    <div key={x.id} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2">
                      <span className="truncate">{s.name} <span className="text-gray-400">× {x.qty}</span></span>
                      {showPrices && <span className="bk-text-gold font-bold text-xs">
                        {new Intl.NumberFormat("ar-DZ").format((s.cost || 0) * x.qty)} د.ج
                      </span>}
                    </div>
                  );
                })}
              </div>
            </div>
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
      )}

      {/* Footer nav */}
      <div className="sticky bottom-3 z-20 bg-white rounded-2xl p-3 shadow-2xl border bk-border-gold flex items-center justify-between gap-2">
        <button type="button" onClick={goBack} disabled={stepIdx === 0}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-gray-100 text-sm font-bold disabled:opacity-40">
          <ChevronRight className="size-4" /> السابق
        </button>

        {step === "summary" ? (
          <button type="button" onClick={submit} disabled={submitting}
            className="bk-gold inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg disabled:opacity-60">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            إرسال طلب الحجز
          </button>
        ) : (
          <button type="button" onClick={goNext}
            className="bk-gold inline-flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg">
            التالي <ChevronLeft className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--bk-gold)] transition";

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <h2 className="font-bold bk-text-primary text-base flex items-center gap-2">{icon} {title}</h2>;
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
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="font-bold bk-text-primary">{value || "—"}</span>
    </div>
  );
}

function Section({ title, icon, hint, children }: { title: string; icon: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold bk-text-primary text-sm flex items-center gap-2">{icon} {title}</h2>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">{children}</div>
    </section>
  );
}

function PickRow({ image, name, meta, price, qty, onChange, maxQty = 99, availableLabel }: {
  image?: string; name: string; meta?: string; price?: number;
  qty: number; onChange: (v: number) => void; maxQty?: number; availableLabel?: string;
}) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl border transition ${qty > 0 ? "bk-border-gold bg-yellow-50/30" : "border-gray-100"}`}>
      <div className="size-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
        {image ? <img src={image} alt="" loading="lazy" className="size-full object-cover" /> : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate bk-text-primary">{name}</div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {meta && <span className="text-[10px] text-gray-500">{meta}</span>}
          {price !== undefined && (
            <span className="text-[11px] font-bold bk-text-gold">{new Intl.NumberFormat("ar-DZ").format(price)} د.ج</span>
          )}
          {availableLabel && <span className="text-[10px] text-green-600 font-bold">{availableLabel}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" onClick={() => onChange(Math.max(0, qty - 1))}
          className="size-8 rounded-lg bg-gray-100 flex items-center justify-center disabled:opacity-40" disabled={qty === 0}>
          <Minus className="size-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-bold">{qty}</span>
        <button type="button" onClick={() => onChange(Math.min(maxQty, qty + 1))}
          className="size-8 rounded-lg bk-gold flex items-center justify-center disabled:opacity-40"
          disabled={qty >= maxQty}>
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
