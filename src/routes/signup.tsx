import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, inputCls } from "@/components/AuthShell";
import { Button } from "@/components/ui-bits";
import { PhoneInput, buildE164 } from "@/components/PhoneInput";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function passwordStrength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) || /[\u0600-\u06FF]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const arr = [
    { label: "ضعيفة جداً", color: "bg-destructive" },
    { label: "ضعيفة", color: "bg-destructive" },
    { label: "متوسطة", color: "bg-warning" },
    { label: "قوية", color: "bg-info" },
    { label: "قوية جداً", color: "bg-success" },
  ];
  return { score: s, ...arr[s] };
}

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+213");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = passwordStrength(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) return setError("يجب إدخال الاسم الكامل");
    if (!phone.trim()) return setError("يجب إدخال رقم الهاتف");
    if (!email.trim()) return setError("يجب إدخال البريد الإلكتروني");
    if (password.length < 8) return setError("كلمة المرور 8 أحرف على الأقل");
    if (password !== confirm) return setError("كلمتا المرور غير متطابقتين");

    setLoading(true);
    const fullPhone = buildE164(countryCode, phone);
    const { error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName.trim(), company_name: fullName.trim(), phone: fullPhone },
      },
    });

    if (signUpErr) {
      setLoading(false);
      return setError(signUpErr.message.includes("already") ? "هذا البريد مسجل مسبقاً" : signUpErr.message);
    }

    // Auto sign-in (email auto-confirm is enabled)
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInErr) return setError(signInErr.message);
    toast.success("تم إنشاء الحساب بنجاح");
    navigate({ to: "/munasabti-manager" });
  }

  return (
    <AuthShell
      variant="immersive"
      title="أنشئ حساباً جديداً"
      subtitle="ابدأ إدارة مناسباتك باحترافية خلال دقائق"
      footer={<>لديك حساب؟ <Link to="/login" className="mr-1 font-bold text-gold underline underline-offset-4 transition hover:text-gold-light">تسجيل الدخول</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-3" data-auth-form>
        <Field label="الاسم الكامل">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              className={`${inputCls} pl-11 text-right`} placeholder="الاسم الكامل" autoComplete="name" maxLength={100} />
          </div>
        </Field>

        <Field label="رقم الهاتف">
          <PhoneInput countryCode={countryCode} onCountryCodeChange={setCountryCode}
            phone={phone} onPhoneChange={setPhone} />
        </Field>

        <Field label="البريد الإلكتروني">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`${inputCls} pl-11 text-right`} dir="rtl" placeholder="البريد الإلكتروني" autoComplete="email" />
          </div>
        </Field>

        <Field label="كلمة المرور">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pl-20 text-right`} dir="rtl" placeholder="كلمة المرور" autoComplete="new-password" />
            <button type="button" onClick={() => setShow(!show)}
              aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="absolute left-11 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-gold">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0,1,2,3].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.color : "bg-secondary"}`} />
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">قوة كلمة المرور: {strength.label}</div>
            </div>
          )}
        </Field>

        <Field label="تأكيد كلمة المرور">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className={`${inputCls} pl-16 text-right`} dir="rtl" placeholder="تأكيد كلمة المرور" autoComplete="new-password" />
            {confirm && password === confirm && <CheckCircle2 className="absolute left-10 top-1/2 size-4 -translate-y-1/2 text-success" />}
          </div>
        </Field>

        {error && <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs leading-5 text-destructive">{error}</div>}

        <Button type="submit" loading={loading} className="w-full rounded-xl py-3 shadow-gold transition hover:-translate-y-0.5" size="lg" variant="gold">
          <UserPlus className="size-4" /> إنشاء الحساب
        </Button>

        <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
          بإنشائك حساباً فأنت توافق على شروط الاستخدام وسياسة الخصوصية.
        </p>
      </form>
    </AuthShell>
  );
}
