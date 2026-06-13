import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarCheck2, ChartNoAxesCombined, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";
import authIllustration from "@/assets/auth-events-illustration.jpg";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string; subtitle?: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <main dir="rtl" className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,.95fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between" aria-label="مزايا Munasabati Pro">
        <img src={authIllustration} alt="قاعة مناسبات فاخرة مزينة بالورود" width={1024} height={1280} className="absolute inset-0 size-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar/40 via-sidebar/55 to-sidebar" />
        <div className="relative z-10 p-10 xl:p-14">
          <Link to="/login" className="inline-flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar/70 p-2.5 pl-5 backdrop-blur-md transition hover:border-gold/60">
            <span className="grid size-11 place-items-center overflow-hidden rounded-xl bg-card shadow-gold">
              <img src={logo} alt="Munasabati Pro" className="size-full object-contain p-1.5" />
            </span>
            <span><strong className="block text-base text-sidebar-foreground">Munasabati Pro</strong><small className="text-sidebar-foreground/60">منصة إدارة المناسبات</small></span>
          </Link>
        </div>
        <div className="relative z-10 max-w-2xl p-10 pt-28 xl:p-14">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold"><Sparkles className="size-4" /> صُممت لنجاح كل مناسبة</span>
          <h2 className="max-w-xl text-4xl font-bold leading-[1.35] text-sidebar-foreground xl:text-5xl">إدارة مناسباتك باحترافية في مكان واحد</h2>
          <p className="mt-5 max-w-lg text-base leading-8 text-sidebar-foreground/70">نظّم الحجوزات والعملاء والديكورات، وتابع أداء أعمالك بتجربة بسيطة تمنحك رؤية كاملة وتحكماً أدق.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-sidebar-foreground/80">
            <span className="inline-flex items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar/60 px-4 py-3 backdrop-blur"><CalendarCheck2 className="size-4 text-gold" /> حجوزات منظمة</span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar/60 px-4 py-3 backdrop-blur"><ChartNoAxesCombined className="size-4 text-gold" /> متابعة لحظية</span>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Link to="/login" className="group mb-7 flex items-center justify-center gap-3 lg:hidden">
            <span className="grid size-12 place-items-center overflow-hidden rounded-2xl border border-border bg-card shadow-gold transition group-hover:-translate-y-0.5"><img src={logo} alt="Munasabati Pro" className="size-full object-contain p-1.5" /></span>
            <span className="text-right"><strong className="block text-lg text-foreground">Munasabati Pro</strong><small className="text-muted-foreground">إدارة المناسبات باحترافية</small></span>
          </Link>
          <div className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-luxury sm:p-9">
            <header className="mb-7 text-center">
              <span className="mb-3 inline-block text-xs font-bold tracking-widest text-gold">MUNASABATI PRO</span>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>}
            </header>
            {children}
            {footer && <div className="mt-7 border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
          <p className="mt-5 text-center text-[10px] tracking-[.18em] text-muted-foreground">© 2026 MUNASABATI PRO</p>
        </div>
      </section>
    </main>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-2 mr-1 block text-xs font-bold text-foreground/80">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-2xl border border-border bg-background/70 px-4 py-3.5 text-sm outline-none transition duration-300 focus:border-gold focus:bg-card focus:ring-4 focus:ring-gold/15 placeholder:text-muted-foreground/55";
