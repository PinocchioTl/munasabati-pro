import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, inputCls } from "@/components/AuthShell";
import { Button } from "@/components/ui-bits";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});


function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("الرجاء إدخال جميع الحقول");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return setError(error.message.includes("Invalid") ? "البريد أو كلمة المرور غير صحيحة" : error.message);
    toast.success("تم تسجيل الدخول بنجاح");
    navigate({ to: "/munasabti-manager" });
  }

  return (
    <AuthShell
      variant="immersive"
      title="مرحباً بك في مناسباتي برو"
      subtitle="إدارة مناسباتك باحترافية في مكان واحد"
      footer={<>ليس لديك حساب؟ <Link to="/signup" className="mr-1 font-bold text-gold underline underline-offset-4 transition hover:text-gold-light">إنشاء حساب جديد</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" data-auth-form>
        <Field label="البريد الإلكتروني">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`${inputCls} pl-11 text-right`} dir="rtl" placeholder="البريد الإلكتروني" autoComplete="email" aria-label="البريد الإلكتروني" />
          </div>
        </Field>
        <Field label="كلمة المرور">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pl-20 text-right`} dir="rtl" placeholder="كلمة المرور" autoComplete="current-password" aria-label="كلمة المرور" />
            <button type="button" onClick={() => setShow(!show)}
              aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="absolute left-11 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-gold">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between gap-3 text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
            <span className={`grid size-4 place-items-center rounded border transition ${remember ? "border-gold bg-gold text-gold-foreground" : "border-border bg-background"}`}>{remember && <Check className="size-3" />}</span>
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="sr-only" /> تذكرني
          </label>
          <Link to="/forgot-password" className="font-bold text-gold transition hover:text-foreground">نسيت كلمة المرور؟</Link>
        </div>
        {error && <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/15 px-4 py-3 text-xs leading-5 text-destructive-foreground">{error}</div>}
        <Button type="submit" loading={loading} className="w-full rounded-xl py-3 shadow-gold transition hover:-translate-y-0.5" size="md" variant="gold">
          تسجيل الدخول
        </Button>
      </form>
    </AuthShell>
  );
}
