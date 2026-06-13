import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, inputCls } from "@/components/AuthShell";
import { Button } from "@/components/ui-bits";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email) return setError("أدخل بريدك الإلكتروني");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="تحقق من بريدك" subtitle="أرسلنا رابطاً آمناً لإعادة تعيين كلمة المرور">
        <div className="text-center space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-success/15 shadow-soft">
            <CheckCircle2 className="size-8 text-success" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            تم إرسال رسالة إلى <span className="font-semibold text-foreground">{email}</span>.
            افتح الرابط لإعادة تعيين كلمة المرور.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-gold transition hover:text-foreground">
            <ArrowLeft className="size-4" /> العودة لتسجيل الدخول
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="نسيت كلمة المرور؟"
      subtitle="أدخل بريدك الإلكتروني وسنرسل لك رابط استعادة آمناً"
      footer={<Link to="/login" className="font-bold text-gold transition hover:text-foreground">العودة لتسجيل الدخول</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="البريد الإلكتروني">
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`${inputCls} pr-11 text-left`} dir="ltr" placeholder="you@example.com" autoComplete="email" />
          </div>
        </Field>
        {error && <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs text-destructive">{error}</div>}
        <Button type="submit" loading={loading} className="w-full rounded-2xl py-3.5 shadow-gold transition hover:-translate-y-0.5" size="lg" variant="gold">
          إرسال رابط الاستعادة
        </Button>
      </form>
    </AuthShell>
  );
}
