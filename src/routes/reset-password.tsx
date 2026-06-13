import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, inputCls } from "@/components/AuthShell";
import { Button } from "@/components/ui-bits";

export const Route = createFileRoute("/reset-password")({
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("8 أحرف على الأقل");
    if (password !== confirm) return setError("كلمتا المرور غير متطابقتين");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    toast.success("تم تحديث كلمة المرور");
    navigate({ to: "/munasabti-manager" });
  }

  return (
    <AuthShell title="كلمة مرور جديدة" subtitle="اختر كلمة مرور قوية ومختلفة لحماية حسابك">
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="كلمة المرور الجديدة">
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-11 pl-11 text-left`} dir="ltr" placeholder="••••••••" autoComplete="new-password" />
            <button type="button" onClick={() => setShow(!show)}
              aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-gold">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Field label="تأكيد كلمة المرور">
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className={`${inputCls} pr-11 text-left`} dir="ltr" placeholder="••••••••" autoComplete="new-password" />
          </div>
        </Field>
        {error && <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-xs text-destructive">{error}</div>}
        <Button type="submit" loading={loading} className="w-full rounded-2xl py-3.5 shadow-gold transition hover:-translate-y-0.5" size="lg" variant="gold">
          <ShieldCheck className="size-4" /> حفظ كلمة المرور
        </Button>
      </form>
    </AuthShell>
  );
}
