import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Trash2, FlaskConical } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isDemoUser, seedDemoData, clearDemoData } from "@/lib/demoData";
import { Card, Button } from "@/components/ui-bits";

export function DemoModePanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<"seed" | "clear" | null>(null);

  if (!isDemoUser(user?.email)) return null;

  const refreshAll = () => qc.invalidateQueries();

  const handleSeed = async () => {
    setBusy("seed");
    try {
      await seedDemoData();
      toast.success("تم تحميل البيانات التجريبية");
      refreshAll();
    } catch (e: any) {
      toast.error(e.message || "فشل التحميل");
    } finally { setBusy(null); }
  };

  const handleClear = async () => {
    if (!confirm("سيتم حذف جميع البيانات التجريبية. متابعة؟")) return;
    setBusy("clear");
    try {
      await clearDemoData();
      toast.success("تم حذف البيانات التجريبية");
      refreshAll();
    } catch (e: any) {
      toast.error(e.message || "فشل الحذف");
    } finally { setBusy(null); }
  };

  return (
    <Card className="p-5 border border-gold-light/45 bg-gradient-gold text-primary-foreground shadow-gold">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="size-12 rounded-2xl bg-primary-foreground/10 flex items-center justify-center text-primary-foreground border border-primary-foreground/15">
          <FlaskConical className="size-6" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-base">وضع المطور — البيانات التجريبية</h3>
            <span className="text-[10px] font-bold bg-primary-foreground/10 text-primary-foreground px-2 py-0.5 rounded-full">DEMO</span>
          </div>
          <p className="text-xs text-primary-foreground/75">
            تحميل أو حذف بيانات تجريبية احترافية لعرض التطبيق. متاح فقط لحساب <code className="font-bold text-primary-foreground">admin@local</code>.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={handleSeed} disabled={busy !== null} className="flex-1 sm:flex-none">
            <Sparkles className="size-4 ml-1" />
            {busy === "seed" ? "جاري التحميل..." : "تحميل البيانات"}
          </Button>
          <Button onClick={handleClear} disabled={busy !== null} variant="outline" className="flex-1 sm:flex-none">
            <Trash2 className="size-4 ml-1" />
            {busy === "clear" ? "جاري الحذف..." : "حذف"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
