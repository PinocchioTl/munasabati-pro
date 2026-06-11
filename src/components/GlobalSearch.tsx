import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, CalendarDays, Users, Sparkles, Package, FileText } from "lucide-react";
import { useBookings, useClients, useDecorations, useSupplies } from "@/lib/db";
import { matches } from "@/lib/search";

type Result = {
  id: string;
  type: "booking" | "client" | "decoration" | "supply" | "page";
  label: string;
  sub?: string;
  to: string;
  q?: string;
  icon: any;
};

const PAGES: Result[] = [
  { id: "p-home", type: "page", label: "الرئيسية", to: "/munasabti-manager", icon: FileText },
  { id: "p-bookings", type: "page", label: "الحجوزات", to: "/munasabti-manager/bookings", icon: CalendarDays },
  { id: "p-calendar", type: "page", label: "التقويم", to: "/munasabti-manager/calendar", icon: CalendarDays },
  { id: "p-requests", type: "page", label: "طلبات الرابط", to: "/munasabti-manager/booking-requests", icon: FileText },
  { id: "p-decor", type: "page", label: "الديكورات", to: "/munasabti-manager/decorations", icon: Sparkles },
  { id: "p-supplies", type: "page", label: "المستلزمات", to: "/munasabti-manager/supplies", icon: Package },
  { id: "p-customers", type: "page", label: "الزبائن", to: "/munasabti-manager/customers", icon: Users },
  { id: "p-profits", type: "page", label: "الأرباح", to: "/munasabti-manager/profits", icon: FileText },
  { id: "p-analytics", type: "page", label: "الإحصائيات", to: "/munasabti-manager/analytics", icon: FileText },
  { id: "p-settings", type: "page", label: "الإعدادات", to: "/munasabti-manager/settings", icon: FileText },
];

const TYPE_LABEL: Record<Result["type"], string> = {
  page: "صفحة",
  booking: "حجز",
  client: "زبون",
  decoration: "ديكور",
  supply: "مستلزم",
};

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: bookings = [] } = useBookings();
  const { data: clients = [] } = useClients();
  const { data: decorations = [] } = useDecorations();
  const { data: supplies = [] } = useSupplies();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo<Result[]>(() => {
    if (!q.trim()) return [];
    const digitsOnly = (v: unknown) => String(v ?? "")
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
      .replace(/\D+/g, "");
    const qDigits = digitsOnly(q);
    const phoneMatch = (phone: unknown) => qDigits.length >= 2 && digitsOnly(phone).includes(qDigits);
    const out: Result[] = [];
    for (const p of PAGES) if (matches(q, [p.label])) out.push(p);
    for (const b of bookings as any[]) {
      if (matches(q, [b.customer_name, b.phone, b.event_date]) || phoneMatch(b.phone)) {
        out.push({
          id: `b-${b.id}`, type: "booking", label: b.customer_name || "حجز",
          sub: [b.event_date, b.phone].filter(Boolean).join(" • "),
          to: "/munasabti-manager/bookings", q: b.customer_name || b.phone || "", icon: CalendarDays,
        });
      }
    }
    for (const c of clients as any[]) {
      if (matches(q, [c.name, c.phone, c.address]) || phoneMatch(c.phone)) {
        out.push({
          id: `c-${c.id}`, type: "client", label: c.name,
          sub: c.phone ?? undefined,
          to: "/munasabti-manager/customers", q: c.name || c.phone || "", icon: Users,
        });
      }
    }
    for (const d of decorations as any[]) {
      if (matches(q, [d.name, d.category])) {
        out.push({
          id: `d-${d.id}`, type: "decoration", label: d.name,
          sub: d.category ?? undefined,
          to: "/munasabti-manager/decorations", q: d.name || "", icon: Sparkles,
        });
      }
    }
    for (const s of supplies as any[]) {
      if (matches(q, [s.name, s.category])) {
        out.push({
          id: `s-${s.id}`, type: "supply", label: s.name,
          sub: s.category ?? undefined,
          to: "/munasabti-manager/supplies", q: s.name || "", icon: Package,
        });
      }
    }
    return out.slice(0, 20);
  }, [q, bookings, clients, decorations, supplies]);


  function go(r: Result) {
    const url = r.q ? `${r.to}?q=${encodeURIComponent(r.q)}` : r.to;
    navigate({ to: url });
    setOpen(false);
    setQ("");
  }

  return (
    <div ref={wrapRef} className="hidden lg:flex flex-1 max-w-md relative mx-4">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); (e.target as HTMLInputElement).blur(); }
          if (e.key === "Enter" && results[0]) go(results[0]);
        }}
        placeholder="بحث عن حجز، زبون، ديكور..."
        className="w-full bg-secondary/60 border border-transparent focus:border-ring focus:bg-card rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none transition"
      />
      {open && q.trim() && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">لا توجد نتائج</div>
          ) : (
            results.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => go(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition text-right"
                >
                  <Icon className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.label}</div>
                    {r.sub && <div className="text-[11px] text-muted-foreground truncate">{r.sub}</div>}
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-secondary rounded px-1.5 py-0.5">
                    {TYPE_LABEL[r.type]}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
