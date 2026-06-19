import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Link2, Check, X, Loader2, Copy, ExternalLink, Share2, QrCode,
  Download, Printer, Eye, CalendarCheck, Clock, TrendingUp, Power,
} from "lucide-react";
import { Card, Button } from "@/components/ui-bits";
import {
  getMyBookingLink, updateSlug, toggleBookingEnabled, checkSlugAvailability,
} from "@/lib/booking-link.functions";
import { ShareBookingLinkModal } from "@/components/ShareBookingLinkModal";
import { PUBLIC_BOOKING_ORIGIN, bookingUrl } from "@/lib/booking-url";
import { formatDateShort } from "@/lib/date-format";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,39}$/;

export function BookingLinkSettings() {
  const qc = useQueryClient();
  const fetchData = useServerFn(getMyBookingLink);
  const updateSlugFn = useServerFn(updateSlug);
  const toggleFn = useServerFn(toggleBookingEnabled);
  const checkFn = useServerFn(checkSlugAvailability);

  const { data, isLoading } = useQuery({
    queryKey: ["booking-link"],
    queryFn: () => fetchData(),
  });

  const [slug, setSlug] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [check, setCheck] = useState<{ status: "idle" | "checking" | "available" | "taken" | "invalid"; msg?: string }>({
    status: "idle",
  });
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (data?.public_slug) setSlug(data.public_slug);
  }, [data?.public_slug]);

  const origin = PUBLIC_BOOKING_ORIGIN;
  const currentSlug = data?.public_slug ?? "";
  const currentUrl = bookingUrl(currentSlug);
  const previewUrl = slug && SLUG_RE.test(slug) ? bookingUrl(slug) : "";

  // Generate QR for current saved url
  useEffect(() => {
    if (!currentUrl) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(currentUrl, { width: 480, margin: 1, color: { dark: "#1a1a1a", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [currentUrl]);

  // Live slug availability check (debounced)
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!slug) {
      setCheck({ status: "idle" });
      return;
    }
    if (!SLUG_RE.test(slug)) {
      setCheck({ status: "invalid", msg: "أحرف إنجليزية صغيرة وأرقام وشرطة فقط (3-40 حرف)" });
      return;
    }
    if (slug === currentSlug) {
      setCheck({ status: "available", msg: "هذا هو رابطك الحالي" });
      return;
    }
    setCheck({ status: "checking" });
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await checkFn({ data: { slug } });
        setCheck(r.available
          ? { status: "available", msg: "الرابط متاح" }
          : { status: "taken", msg: "هذا الرابط مستخدم بالفعل" });
      } catch (e: any) {
        setCheck({ status: "invalid", msg: e.message || "خطأ في التحقق" });
      }
    }, 400);
  }, [slug, currentSlug, checkFn]);

  const saveMut = useMutation({
    mutationFn: (s: string) => updateSlugFn({ data: { slug: s } }),
    onSuccess: () => {
      toast.success("تم حفظ الرابط بنجاح");
      qc.invalidateQueries({ queryKey: ["booking-link"] });
    },
    onError: (e: any) => toast.error("فشل الحفظ", { description: e.message }),
  });

  const toggleMut = useMutation({
    mutationFn: (enabled: boolean) => toggleFn({ data: { enabled } }),
    onSuccess: (_r, enabled) => {
      toast.success(enabled ? "تم تفعيل الرابط" : "تم تعطيل الرابط");
      qc.invalidateQueries({ queryKey: ["booking-link"] });
    },
    onError: (e: any) => toast.error("فشل التحديث", { description: e.message }),
  });

  const handleCopy = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("لم يتم النسخ");
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `booking-${currentSlug}-qr.png`;
    a.click();
  };

  const handlePrintQR = () => {
    if (!qrDataUrl) return;
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) return;
    w.document.write(`
      <html lang="ar" dir="rtl"><head><title>QR — ${currentSlug}</title>
      <style>body{font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;gap:16px}
      img{width:320px;height:320px}p{color:#444;font-size:14px;word-break:break-all;text-align:center;max-width:80%}</style>
      </head><body>
      <h2 style="margin:0">امسح للحجز</h2>
      <img src="${qrDataUrl}" alt="QR" />
      <p>${currentUrl}</p>
      <script>window.onload=()=>{window.print();}</script>
      </body></html>`);
    w.document.close();
  };

  const conversion = useMemo(() => {
    const v = data?.link_views ?? 0;
    const b = data?.bookings_count ?? 0;
    if (!v) return 0;
    return Math.round((b / v) * 100);
  }, [data]);

  const canSave =
    check.status === "available" && slug !== currentSlug && !saveMut.isPending;

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-gold" />
      </Card>
    );
  }

  const enabled = data?.booking_enabled ?? true;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header card */}
      <Card className="p-5 bg-gradient-to-l from-gold/5 to-transparent border-gold/20">
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-2xl bg-gradient-gold text-primary flex items-center justify-center shadow-gold shrink-0">
            <Link2 className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">إعدادات رابط الحجز</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              الرابط الذي ستشاركه مع الزبائن لاستقبال طلبات الحجز
            </p>
          </div>
        </div>
      </Card>

      {/* Customize slug */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
            <Link2 className="size-4" />
          </div>
          <h3 className="font-bold">تخصيص الرابط</h3>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-2">الرابط الحالي</label>
          <div
            dir="ltr"
            className="flex items-stretch rounded-xl border border-border/60 bg-secondary/40 overflow-hidden focus-within:ring-2 focus-within:ring-ring"
          >
            <div className="px-3 py-2.5 text-xs text-muted-foreground bg-secondary/60 border-l border-border/60 flex items-center whitespace-nowrap font-mono">
              {origin.replace(/^https?:\/\//, "")}/munasabti-booking/
            </div>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
              placeholder="ahmed-decor"
              className="flex-1 bg-transparent px-3 py-2.5 text-sm font-medium outline-none font-mono"
              maxLength={40}
            />
            <div className="px-3 flex items-center text-xs shrink-0">
              {check.status === "checking" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              {check.status === "available" && <Check className="size-4 text-success" />}
              {(check.status === "taken" || check.status === "invalid") && <X className="size-4 text-destructive" />}
            </div>
          </div>
          {check.msg && (
            <p
              className={`text-xs mt-2 ${
                check.status === "available"
                  ? "text-success"
                  : check.status === "checking"
                  ? "text-muted-foreground"
                  : "text-destructive"
              }`}
            >
              {check.msg}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[10px] text-muted-foreground">اقتراحات:</span>
            {["ahmed-decor", "wedding-batna", "decor-luxury"].map(s => (
              <button
                key={s}
                onClick={() => setSlug(s)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {previewUrl && (
          <div className="text-xs bg-secondary/30 rounded-lg px-3 py-2 break-all text-muted-foreground">
            <span className="font-bold">معاينة:</span> <span dir="ltr">{previewUrl}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="gold"
            size="md"
            disabled={!canSave}
            loading={saveMut.isPending}
            onClick={() => saveMut.mutate(slug)}
            className="flex-1"
          >
            <Check className="size-4" /> حفظ الرابط
          </Button>
          {currentSlug && (
            <Button variant="outline" size="md" onClick={() => setSlug(currentSlug)}>
              تراجع
            </Button>
          )}
        </div>
      </Card>

      {/* Enable / disable */}
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
            enabled ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            <Power className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold">حالة الرابط</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {enabled
                ? "الرابط مفعّل ويستقبل طلبات حجز جديدة"
                : "الرابط معطّل — الزوار يرون صفحة 'الحجوزات متوقفة حالياً'"}
            </div>
          </div>
          <Toggle
            value={enabled}
            onChange={(v) => toggleMut.mutate(v)}
            disabled={toggleMut.isPending}
          />
        </div>
      </Card>

      {/* QR Code */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-info/10 text-info flex items-center justify-center">
            <QrCode className="size-4" />
          </div>
          <h3 className="font-bold">رمز QR للرابط</h3>
        </div>

        {!currentSlug ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            احفظ الرابط أولاً لإنشاء رمز QR
          </div>
        ) : qrDataUrl ? (
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="p-3 bg-white rounded-2xl border border-border shrink-0">
              <img src={qrDataUrl} alt="QR" className="size-40 block" />
            </div>
            <div className="flex-1 w-full space-y-2">
              <p className="text-xs text-muted-foreground">
                يحتوي رمز QR على رابط الحجز الخاص بك. شاركه أو اطبعه ليتمكن الزبائن من المسح والحجز مباشرة.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                  <Download className="size-4" /> تحميل PNG
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintQR}>
                  <Printer className="size-4" /> طباعة
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="size-4" /> نسخ الرابط
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </Card>

      {/* Share */}
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-gold text-primary flex items-center justify-center shrink-0 shadow-gold">
            <Share2 className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold">مشاركة رابط الحجز</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              عبر واتساب، تيليجرام، ماسنجر أو مشاركة الجهاز
            </div>
          </div>
          <Button variant="gold" size="md" onClick={() => setShareOpen(true)} disabled={!currentSlug}>
            <Share2 className="size-4" /> مشاركة
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
            <TrendingUp className="size-4" />
          </div>
          <h3 className="font-bold">إحصائيات الرابط</h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatBox
            icon={<Eye className="size-4" />}
            label="مرات الفتح"
            value={data?.link_views ?? 0}
            color="text-info bg-info/10"
          />
          <StatBox
            icon={<CalendarCheck className="size-4" />}
            label="طلبات الحجز"
            value={data?.bookings_count ?? 0}
            color="text-gold bg-gold/10"
          />
          <StatBox
            icon={<Clock className="size-4" />}
            label="آخر زيارة"
            value={
              data?.last_visit_at
                ? new Date(data.last_visit_at).toLocaleDateString("ar")
                : "—"
            }
            color="text-warning bg-warning/10"
          />
          <StatBox
            icon={<TrendingUp className="size-4" />}
            label="معدل التحويل"
            value={`${conversion}%`}
            color="text-success bg-success/10"
          />
        </div>
      </Card>

      <ShareBookingLinkModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}

function StatBox({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
      <div className={`size-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>{icon}</div>
      <div className="text-lg font-bold truncate">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Toggle({
  value, onChange, disabled,
}: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition shrink-0 ${
        value ? "bg-gradient-gold shadow-gold" : "bg-secondary/80"
      } ${disabled ? "opacity-60" : ""}`}
      aria-pressed={value}
    >
      <span
        className={`absolute top-0.5 size-6 rounded-full bg-card shadow-soft transition ${
          value ? "right-0.5" : "right-[22px]"
        }`}
      />
    </button>
  );
}
