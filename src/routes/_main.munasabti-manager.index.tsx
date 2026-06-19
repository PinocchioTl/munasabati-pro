import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useBookings, useDecorations, useSupplies, useNotifications,
  formatSAR, eventTypeLabels, statusLabels,
} from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { BookingDialog } from "@/components/BookingDialog";
import { DemoModePanel } from "@/components/DemoModePanel";
import {
  CalendarDays, Sparkles, Wallet, AlertTriangle, Plus, Clock, MapPin,
  Inbox, ArrowUpRight, TrendingUp, Crown, ChevronLeft, Bell, Phone,
  AlertCircle, Activity, Package,
} from "lucide-react";
import { ResponsiveContainer, Area, AreaChart, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { MAGHREBI_MONTHS_SHORT, AR_WEEKDAYS_LONG, formatDateLong } from "@/lib/date-format";

export const Route = createFileRoute("/_main/munasabti-manager/")({
  component: Dashboard,
});

const arabicMonths = MAGHREBI_MONTHS_SHORT;
const arabicDays = AR_WEEKDAYS_LONG;

function todayISO() { return new Date().toISOString().slice(0, 10); }

function Dashboard() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: bookings = [] } = useBookings();
  const { data: decorations = [] } = useDecorations();
  const { data: supplies = [] } = useSupplies();
  const { data: notifications = [] } = useNotifications();

  const first = (user?.user_metadata?.full_name as string)?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "صديقي";

  const today = todayISO();
  const now = new Date();
  const dateLabel = `${arabicDays[now.getDay()]} • ${now.getDate()} ${arabicMonths[now.getMonth()]}`;

  const insights = useMemo(() => {
    const todayBookings = bookings.filter(b => b.event_date === today && b.status !== "cancelled");
    const upcoming7 = bookings.filter(b => {
      if (b.status === "cancelled" || b.status === "completed") return false;
      const d = new Date(b.event_date).getTime();
      const diff = (d - now.getTime()) / 86400000;
      return diff > 0 && diff <= 7;
    }).sort((a,b) => a.event_date.localeCompare(b.event_date));

    const pending = bookings.filter(b => b.status === "pending");
    const pendingPayments = bookings
      .filter(b => +b.remaining > 0 && b.status !== "cancelled")
      .reduce((s, b) => s + +b.remaining, 0);

    // monthly chart (last 6 months)
    const monthly: Record<string, { revenue: number; profit: number }> = {};
    bookings.forEach(b => {
      if (b.status === "cancelled") return;
      const m = b.event_date.slice(0, 7);
      monthly[m] ??= { revenue: 0, profit: 0 };
      monthly[m].revenue += +b.total_price;
      monthly[m].profit += +b.net_profit;
    });
    const monthlyArr = Object.entries(monthly).sort()
      .slice(-6)
      .map(([k, v]) => ({ month: arabicMonths[+k.slice(5,7)-1], ...v }));

    const currentMonth = today.slice(0,7);
    const thisMonthRevenue = monthly[currentMonth]?.revenue || 0;
    const thisMonthProfit = monthly[currentMonth]?.profit || 0;

    const lowStock = supplies.filter(s => (s.total_qty - s.used_qty) <= s.min_alert);
    const topDecorations = [...decorations]
      .sort((a,b) => b.bookings_count - a.bookings_count).slice(0, 5);

    // Recent activity = last 6 bookings sorted by created_at
    const recent = [...bookings]
      .sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);

    return {
      todayBookings, upcoming7, pending, pendingPayments,
      monthlyArr, thisMonthRevenue, thisMonthProfit,
      lowStock, topDecorations, recent,
    };
  }, [bookings, decorations, supplies, today]);

  return (
    <div className="space-y-5 lg:space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground mb-1">{dateLabel}</div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight truncate">
            مرحباً <span className="text-gradient-gold">{first}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {insights.todayBookings.length > 0
              ? `لديك ${insights.todayBookings.length} مناسبة اليوم`
              : "لا توجد مناسبات اليوم — استمتع بيومك"}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="hidden sm:inline-flex items-center gap-2 bg-gradient-gold text-primary rounded-xl px-4 py-2.5 text-sm font-bold shadow-gold hover:opacity-95 transition shrink-0"
        >
          <Plus className="size-4" /> حجز جديد
        </button>
      </div>

      <DemoModePanel />

      {/* Key metrics — today first */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Metric
          label="حجوزات اليوم"
          value={insights.todayBookings.length}
          sub={`${insights.upcoming7.length} هذا الأسبوع`}
          icon={CalendarDays}
          accent="gold"
          to="/munasabti-manager/calendar"
        />
        <Metric
          label="طلبات معلقة"
          value={insights.pending.length}
          sub="تحتاج مراجعتك"
          icon={Inbox}
          accent="warning"
          to="/munasabti-manager/bookings"
        />
        <Metric
          label="دخل الشهر"
          value={formatSAR(insights.thisMonthRevenue)}
          sub={`ربح: ${formatSAR(insights.thisMonthProfit)}`}
          icon={Wallet}
          accent="success"
          to="/munasabti-manager/profits"
        />
        <Metric
          label="مدفوعات متبقية"
          value={formatSAR(insights.pendingPayments)}
          sub={`${bookings.filter(b => +b.remaining > 0 && b.status !== "cancelled").length} حجز`}
          icon={AlertTriangle}
          accent="info"
          to="/munasabti-manager/bookings"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Today's agenda — spans 2 */}
        <Card className="lg:col-span-2">
          <CardHeader
            eyebrow="جدول اليوم"
            title="ما يجب عليك إنجازه"
            action={
              <Link
                to="/munasabti-manager/calendar"
                className="text-xs font-bold text-foreground hover:text-gold transition flex items-center gap-1"
              >
                التقويم <ChevronLeft className="size-3" />
              </Link>
            }
          />
          {insights.todayBookings.length === 0 && insights.upcoming7.length === 0 ? (
            <EmptyHint
              icon={CalendarDays}
              title="لا توجد مناسبات في الأيام القادمة"
              hint="اضغط حجز جديد لإضافة أول حجز"
            />
          ) : (
            <ul className="divide-y divide-border">
              {insights.todayBookings.map(b => (
                <AgendaRow key={b.id} booking={b} today />
              ))}
              {insights.upcoming7.slice(0, 5).map(b => (
                <AgendaRow key={b.id} booking={b} />
              ))}
            </ul>
          )}
        </Card>

        {/* Quick actions + alerts */}
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="إجراءات سريعة" title="ابدأ بسرعة" />
            <div className="grid grid-cols-2 gap-2">
              <QuickAction to="/munasabti-manager/bookings" icon={CalendarDays} label="حجز جديد" />
              <QuickAction to="/munasabti-manager/decorations" icon={Sparkles} label="ديكور جديد" />
              <QuickAction to="/munasabti-manager/supplies" icon={Package} label="مستلزم" />
              <QuickAction to="/munasabti-manager/calendar" icon={Crown} label="التقويم" />
            </div>
          </Card>

          {(insights.pending.length > 0 || insights.lowStock.length > 0 || notifications.filter(n => !n.is_read).length > 0) && (
            <Card>
              <CardHeader eyebrow="تحتاج انتباهك" title="تنبيهات مهمة" />
              <div className="space-y-2.5">
                {insights.pending.length > 0 && (
                  <AlertItem
                    color="warning"
                    icon={AlertCircle}
                    title={`${insights.pending.length} حجز بانتظار التأكيد`}
                    to="/munasabti-manager/bookings"
                  />
                )}
                {insights.lowStock.length > 0 && (
                  <AlertItem
                    color="destructive"
                    icon={Package}
                    title={`${insights.lowStock.length} مستلزمات قاربت على النفاد`}
                    to="/munasabti-manager/supplies"
                  />
                )}
                {notifications.filter(n => !n.is_read).slice(0, 2).map(n => (
                  <AlertItem
                    key={n.id}
                    color={n.level === "error" ? "destructive" : n.level === "warning" ? "warning" : "info"}
                    icon={Bell}
                    title={n.title}
                    to="/munasabti-manager"
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Revenue chart + top decorations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <Card className="lg:col-span-2">
          <CardHeader
            eyebrow="آخر 6 أشهر"
            title="تطور الإيرادات"
            action={
              <Link to="/munasabti-manager/profits" className="text-xs font-bold hover:text-gold transition flex items-center gap-1">
                تفاصيل <ChevronLeft className="size-3" />
              </Link>
            }
          />
          <div className="h-56 lg:h-64 -mx-2">
            {insights.monthlyArr.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                <TrendingUp className="size-8 opacity-30" />
                لا توجد بيانات بعد
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights.monthlyArr} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} reversed axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} orientation="right" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any) => formatSAR(Number(v))}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--gold)" strokeWidth={2.5} fill="url(#gradRev)" name="الدخل" />
                  <Area type="monotone" dataKey="profit" stroke="var(--success)" strokeWidth={2.5} fill="url(#gradProf)" name="الربح" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader eyebrow="الأكثر طلباً" title="أفضل الديكورات" />
          {insights.topDecorations.length === 0 ? (
            <EmptyHint icon={Sparkles} title="لا توجد ديكورات بعد" hint="" />
          ) : (
            <div className="space-y-3.5">
              {insights.topDecorations.map((d, i) => {
                const pct = Math.round((d.booked_qty / Math.max(d.total_qty, 1)) * 100);
                return (
                  <div key={d.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`size-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          i === 0 ? "bg-gradient-gold text-primary" : "bg-secondary text-muted-foreground"
                        }`}>{i + 1}</span>
                        <span className="font-semibold truncate">{d.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground shrink-0">{d.bookings_count}×</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-gold rounded-full transition-all" style={{ width: `${Math.max(pct, 6)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader
          eyebrow="آخر النشاط"
          title="الحجوزات الأخيرة"
          action={
            <Link to="/munasabti-manager/bookings" className="text-xs font-bold hover:text-gold transition flex items-center gap-1">
              عرض الكل <ChevronLeft className="size-3" />
            </Link>
          }
        />
        {insights.recent.length === 0 ? (
          <EmptyHint icon={Activity} title="لا يوجد نشاط بعد" hint="" />
        ) : (
          <div className="divide-y divide-border">
            {insights.recent.map(b => (
              <div key={b.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className="size-10 rounded-xl bg-gradient-luxury text-gold flex items-center justify-center font-bold text-[10px] shrink-0 ring-1 ring-white/10">
                  {b.code?.split("-")[1]?.slice(0,3) || "•"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{b.customer_name}</span>
                    {+b.total_price >= 30000 && <Crown className="size-3.5 text-gold shrink-0" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                    <span>{eventTypeLabels[b.event_type]}</span>
                    <span className="opacity-40">•</span>
                    <span>{formatDateLong(b.event_date)}</span>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-sm font-bold">{formatSAR(+b.total_price)}</div>
                  <StatusPill status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <BookingDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/* ───────── Atomic components ───────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-2xl border border-gold/20 shadow-elegant p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        {eyebrow && <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground/70 mb-1">{eyebrow}</div>}
        <div className="text-base font-bold text-gold-light truncate">{title}</div>
      </div>
      {action}
    </div>
  );
}

const accentMap = {
  gold: { bg: "from-gold/15 to-gold/0", icon: "text-gold bg-gold/10" },
  warning: { bg: "from-warning/15 to-warning/0", icon: "text-warning bg-warning/10" },
  success: { bg: "from-success/15 to-success/0", icon: "text-success bg-success/10" },
  info: { bg: "from-info/15 to-info/0", icon: "text-info bg-info/10" },
} as const;

function Metric({
  label, value, sub, icon: Icon, accent, to,
}: {
  label: string; value: React.ReactNode; sub?: string; icon: any;
  accent: keyof typeof accentMap; to?: string;
}) {
  const a = accentMap[accent];
  const inner = (
    <div className="relative bg-card rounded-2xl border border-gold/20 shadow-elegant p-4 lg:p-5 overflow-hidden group hover:shadow-luxury transition">
      <div className={`absolute inset-0 bg-linear-to-bl ${a.bg} opacity-60 pointer-events-none`} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={`size-10 rounded-xl flex items-center justify-center ${a.icon}`}>
            <Icon className="size-[18px]" />
          </div>
          {to && <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />}
        </div>
        <div className="mt-3 text-xl lg:text-2xl font-bold tracking-tight text-gold-light truncate">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-1 truncate font-medium">{label}</div>
        {sub && <div className="text-[11px] text-muted-foreground/70 mt-1.5 truncate">{sub}</div>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function AgendaRow({ booking: b, today }: { booking: any; today?: boolean }) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className={`flex flex-col items-center justify-center size-12 rounded-xl shrink-0 ${
        today ? "bg-gradient-gold text-primary" : "bg-secondary/60 text-foreground"
      }`}>
        <span className="text-[10px] font-bold">{today ? "اليوم" : b.event_date.slice(8, 10)}</span>
        <span className="text-[10px] font-semibold leading-none">{b.start_time?.slice(0,5)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{b.customer_name}</span>
          <StatusPill status={b.status} />
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1"><Clock className="size-3" />{b.start_time?.slice(0,5)}–{b.end_time?.slice(0,5)}</span>
          {b.location && (
            <>
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-1 truncate"><MapPin className="size-3" />{b.location}</span>
            </>
          )}
        </div>
      </div>
      {b.phone && (
        <a
          href={`tel:${b.phone}`}
          className="hidden sm:flex size-9 rounded-xl bg-secondary/60 hover:bg-secondary text-foreground items-center justify-center transition shrink-0"
          title="اتصل"
        >
          <Phone className="size-4" />
        </a>
      )}
    </li>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-secondary hover:bg-secondary/75 border border-gold/10 hover:border-gold/25 transition group"
    >
      <div className="size-9 rounded-full bg-background border border-gold/20 flex items-center justify-center text-gold group-hover:scale-110 transition">
        <Icon className="size-[18px]" />
      </div>
      <span className="text-[11px] font-semibold">{label}</span>
    </Link>
  );
}

function AlertItem({ color, icon: Icon, title, to }: { color: "warning"|"destructive"|"info"; icon: any; title: string; to: string }) {
  const map = {
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
    info: "text-info bg-info/10",
  };
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition group"
    >
      <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${map[color]}`}>
        <Icon className="size-4" />
      </div>
      <div className="text-sm font-medium flex-1 min-w-0 truncate">{title}</div>
      <ChevronLeft className="size-4 text-muted-foreground group-hover:text-foreground transition shrink-0" />
    </Link>
  );
}

function EmptyHint({ icon: Icon, title, hint }: { icon: any; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 gap-2">
      <div className="size-12 rounded-2xl bg-secondary/60 text-muted-foreground flex items-center justify-center">
        <Icon className="size-5" />
      </div>
      <div className="text-sm font-semibold">{title}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  confirmed: "bg-success/15 text-success border-success/30",
  in_progress: "bg-info/15 text-info border-info/30",
  completed: "bg-secondary text-muted-foreground border-border",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[status] ?? statusColors.completed}`}>
      <span className="size-1 rounded-full bg-current" />
      {statusLabels[status as keyof typeof statusLabels] ?? status}
    </span>
  );
}

