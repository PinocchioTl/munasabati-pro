import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Copy, ExternalLink, Link2, Share2, MessageCircle, Send, MessageSquare, QrCode, Download } from "lucide-react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui-bits";
import { bookingUrl } from "@/lib/booking-url";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShareBookingLinkModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = slug ? `${origin}/munasabti-booking/${slug}` : "";

  useEffect(() => {
    if (!open || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("profiles")
      .select("public_slug")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSlug(data?.public_slug || "");
        setLoading(false);
      });
  }, [open, user]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }
    if (url) {
      QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: "#1a1a1a", light: "#ffffff" } })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(""));
    }
  }, [open, url]);

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `booking-${slug}-qr.png`;
    a.click();
  };

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("تم نسخ الرابط بنجاح");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("لم يتم نسخ الرابط");
    }
  };

  const handleOpen = () => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (!url) return;
    const shareData = {
      title: "حجز الديكورات",
      text: "اطلب حجز ديكوراتك الآن",
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      toast.info("مشاركة الجهاز غير متوفرة", {
        description: "يمكنك نسخ الرابط ومشاركته يدوياً",
      });
    }
  };

  const shareToWhatsApp = () => {
    if (!url) return;
    const text = encodeURIComponent(`اطلب حجز ديكوراتك الآن: ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const shareToTelegram = () => {
    if (!url) return;
    const text = encodeURIComponent(`اطلب حجز ديكوراتك الآن`);
    const urlEnc = encodeURIComponent(url);
    window.open(`https://t.me/share/url?url=${urlEnc}&text=${text}`, "_blank", "noopener,noreferrer");
  };

  const shareToMessenger = () => {
    if (!url) return;
    const urlEnc = encodeURIComponent(url);
    window.open(`https://www.facebook.com/dialog/send?link=${urlEnc}&app_id=184683071273&redirect_uri=${urlEnc}`, "_blank", "noopener,noreferrer");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-luxury overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border/60">
          <div className="size-10 rounded-xl bg-gradient-gold text-primary flex items-center justify-center shadow-gold shrink-0">
            <Link2 className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">مشاركة رابط الحجز</h2>
            <p className="text-xs text-muted-foreground">الرابط الخاص بصفحة الحجز العامة</p>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-xl hover:bg-secondary flex items-center justify-center transition shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {loading ? (
            <div className="py-8 text-center">
              <div className="size-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">جاري التحميل...</p>
            </div>
          ) : !slug ? (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto size-14 rounded-2xl bg-secondary/60 flex items-center justify-center text-muted-foreground">
                <Link2 className="size-6" />
              </div>
              <div>
                <p className="font-bold text-base">لم يتم إعداد الرابط بعد</p>
                <p className="text-sm text-muted-foreground mt-1">
                  اذهب إلى الإعدادات ← منصة الحجز واختر رابطاً مخصصاً
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Link box */}
              <div className="space-y-2">
                <label className="text-sm font-bold">رابط الحجز الخاص بك</label>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 bg-secondary/60 rounded-xl px-4 py-3 text-sm text-foreground break-all border border-border/60 flex items-center min-h-[48px]">
                    {url}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant={copied ? "gold" : "outline"}
                  size="md"
                  onClick={handleCopy}
                  className="w-full"
                >
                  <Copy className="size-4" />
                  {copied ? "تم النسخ" : "نسخ الرابط"}
                </Button>
                <Button variant="outline" size="md" onClick={handleOpen} className="w-full">
                  <ExternalLink className="size-4" />
                  فتح الرابط
                </Button>
              </div>

              {/* Native share */}
              <Button variant="gold" size="md" onClick={handleNativeShare} className="w-full">
                <Share2 className="size-4" />
                مشاركة مباشرة
              </Button>

              {/* QR Code */}
              {qrDataUrl && (
                <div className="pt-3 border-t border-border/60">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="size-4 text-gold" />
                    <p className="text-sm font-bold">رمز QR للرابط</p>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-white rounded-xl border border-border/60">
                      <img src={qrDataUrl} alt="QR" className="size-40 block" />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadQR} className="w-full">
                      <Download className="size-4" /> تحميل رمز QR
                    </Button>
                  </div>
                </div>
              )}

              {/* Social share */}
              <div className="pt-3 border-t border-border/60">
                <p className="text-xs font-bold text-muted-foreground mb-3 text-center">أو مشاركة عبر</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={shareToWhatsApp}
                    className="flex flex-col items-center gap-1.5 group"
                    title="واتساب"
                  >
                    <div className="size-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center transition group-hover:scale-105 group-hover:bg-[#25D366]/20">
                      <MessageCircle className="size-6" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">واتساب</span>
                  </button>
                  <button
                    onClick={shareToMessenger}
                    className="flex flex-col items-center gap-1.5 group"
                    title="ماسنجر"
                  >
                    <div className="size-12 rounded-2xl bg-[#0084FF]/10 text-[#0084FF] flex items-center justify-center transition group-hover:scale-105 group-hover:bg-[#0084FF]/20">
                      <MessageSquare className="size-6" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">ماسنجر</span>
                  </button>
                  <button
                    onClick={shareToTelegram}
                    className="flex flex-col items-center gap-1.5 group"
                    title="تيليجرام"
                  >
                    <div className="size-12 rounded-2xl bg-[#0088CC]/10 text-[#0088CC] flex items-center justify-center transition group-hover:scale-105 group-hover:bg-[#0088CC]/20">
                      <Send className="size-6" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">تيليجرام</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
