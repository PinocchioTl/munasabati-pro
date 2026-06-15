import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, CalendarDays, CalendarRange, Sparkles, Package,
  Users, Wallet, Bell, BarChart3, Settings, Search, Plus, Crown, LogOut,
  Share2, Inbox, Palette, PanelLeftClose, PanelLeftOpen,
  Menu, MoreHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ShareBookingLinkModal } from "@/components/ShareBookingLinkModal";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNotifications } from "@/lib/db";
import { useAuth, signOut } from "@/lib/auth";
import { useBranding } from "@/lib/branding";
import { GlobalSearch } from "@/components/GlobalSearch";

type NavItem = { to: string; label: string; icon: any; badge?: "notif" };

const primaryNav: NavItem[] = [
  { to: "/munasabti-manager", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/munasabti-manager/bookings", label: "الحجوزات", icon: CalendarDays },
  { to: "/munasabti-manager/calendar", label: "التقويم", icon: CalendarRange },
  { to: "/munasabti-manager/booking-requests", label: "طلبات الرابط", icon: Inbox },
];

const catalogNav: NavItem[] = [
  { to: "/munasabti-manager/decorations", label: "الديكورات", icon: Sparkles },
  { to: "/munasabti-manager/supplies", label: "المستلزمات", icon: Package },
  { to: "/munasabti-manager/customers", label: "الزبائن", icon: Users },
];

const insightsNav: NavItem[] = [
  { to: "/munasabti-manager/profits", label: "الأرباح", icon: Wallet },
  { to: "/munasabti-manager/analytics", label: "الإحصائيات", icon: BarChart3 },
];

const systemNav: NavItem[] = [
  { to: "/munasabti-manager/booking-page-builder", label: "تخصيص صفحة الحجز", icon: Palette },
  { to: "/munasabti-manager/notifications", label: "الإشعارات", icon: Bell, badge: "notif" },
  { to: "/munasabti-manager/settings", label: "الإعدادات", icon: Settings },
];

const groups: { label?: string; items: NavItem[] }[] = [
  { items: primaryNav },
  { label: "الكتالوج", items: catalogNav },
  { label: "التحليلات", items: insightsNav },
  { label: "النظام", items: systemNav },
];

// Keep the most frequent destinations visible; every other route is in "More" and the drawer.
const mobileNav: NavItem[] = [
  { to: "/munasabti-manager", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/munasabti-manager/bookings", label: "الحجوزات", icon: CalendarDays },
  { to: "/munasabti-manager/calendar", label: "التقويم", icon: CalendarRange },
  { to: "/munasabti-manager/booking-requests", label: "الطلبات", icon: Inbox },
];

const SIDEBAR_KEY = "mm.sidebar.collapsed";

function isActivePath(pathname: string, to: string) {
  if (to === "/munasabti-manager") return pathname === to || pathname === `${to}/`;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: notifications = [] } = useNotifications();
  const unread = notifications.filter((n) => !n.is_read).length;
  const { branding } = useBranding();
  const [shareOpen, setShareOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1"); } catch {}
  }, []);
  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  }

  const allItems = groups.flatMap(g => g.items);
  const currentTitle = allItems.find(i => isActivePath(pathname, i.to))?.label ?? "";

  return (
    <div className="min-h-screen bg-background flex w-full" dir="rtl" data-manager-root>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex shrink-0 flex-col bg-sidebar text-sidebar-foreground sticky top-0 h-screen border-l border-gold/20 transition-[width] duration-300 ease-out shadow-luxury ${
          collapsed ? "w-[78px]" : "w-64"
        }`}
      >
        {/* Brand */}
        <div className="px-4 py-5 border-b border-gold/20">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="size-11 rounded-xl border border-gold/45 bg-sidebar-accent flex items-center justify-center overflow-hidden shrink-0">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.companyName} className="size-full object-contain" />
              ) : (
                <Crown className="size-5 text-primary" />
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-base font-bold text-gold truncate leading-tight tracking-wide">{branding.companyName}</div>
                <div className="text-[10px] text-sidebar-foreground/50 truncate tracking-[0.18em]">MUNASABATI PRO</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5 scrollbar-none">
          {groups.map((g, gi) => (
            <div key={gi}>
              {g.label && !collapsed && (
                <div className="px-2 mb-1.5 text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/40 font-bold">
                  {g.label}
                </div>
              )}
              {g.label && collapsed && (
                <div className="mx-auto mb-1.5 h-px w-6 bg-sidebar-border/60" />
              )}
              <div className="space-y-1">
                {g.items.map((item) => (
                  <SidebarItem
                    key={item.to}
                    item={item}
                    active={isActivePath(pathname, item.to)}
                    collapsed={collapsed}
                    badge={item.badge === "notif" ? unread : 0}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse + user */}
        <div className="px-2.5 pb-2 pt-1 border-t border-sidebar-border/40">
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "توسيع" : "طي"}
            className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-xs font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition"
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : (
              <>
                <PanelLeftClose className="size-4" />
                <span>طي القائمة</span>
              </>
            )}
          </button>
        </div>
        <UserCard collapsed={collapsed} />
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col" data-manager-main>
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-sidebar/95 text-sidebar-foreground backdrop-blur-xl border-b border-gold/20 shadow-soft">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-8 h-14 sm:h-16">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              className="md:hidden shrink-0 text-sidebar-foreground hover:bg-card"
              aria-label="فتح قائمة الصفحات"
            >
              <Menu className="size-5" />
            </Button>
            {/* Mobile brand */}
            <div className="md:hidden flex items-center gap-2 min-w-0">
              <div className="size-9 rounded-xl bg-gradient-gold flex items-center justify-center overflow-hidden shrink-0">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt={branding.companyName} className="size-full object-contain" />
                ) : (
                  <Crown className="size-4 text-primary" />
                )}
              </div>
              <span className="font-bold text-sm truncate">{currentTitle || branding.companyName}</span>
            </div>

            {/* Desktop page title */}
            <div className="hidden md:flex items-center gap-2 min-w-0 ml-2">
              <h1 className="text-base font-bold text-sidebar-foreground truncate">{currentTitle}</h1>
            </div>

            {/* Search */}
            <GlobalSearch />

            <div className="flex-1 lg:hidden" />

            {/* Share */}
            <button
              onClick={() => setShareOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-secondary hover:bg-card text-sidebar-foreground transition rounded-xl px-3 py-2 text-xs font-semibold border border-gold/15"
              title="مشاركة رابط الحجز"
            >
              <Share2 className="size-4" />
              <span className="hidden xl:inline">مشاركة الرابط</span>
            </button>

            {/* Notifications */}
            <Link
              to="/munasabti-manager/notifications"
              className="relative size-9 sm:size-10 rounded-xl hover:bg-card flex items-center justify-center transition"
              title="الإشعارات"
            >
              <Bell className="size-[18px]" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground flex items-center justify-center px-1 ring-2 ring-background">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            {/* Primary action */}
            <button
              onClick={() => navigate({ to: "/munasabti-manager/bookings" })}
              className="inline-flex items-center gap-2 bg-gradient-gold text-primary-foreground hover:opacity-95 transition rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-bold shadow-gold"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">حجز جديد</span>
            </button>
          </div>
        </header>

        <div className="flex-1 min-w-0 max-w-full overflow-x-hidden px-3 sm:px-5 lg:px-8 py-4 sm:py-6 lg:py-8 pb-24 md:pb-8 animate-fade-in" data-manager-content>
          <Outlet />
        </div>
      </main>

      <ShareBookingLinkModal open={shareOpen} onClose={() => setShareOpen(false)} />

      <MobileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        pathname={pathname}
        unread={unread}
        companyName={branding.companyName}
        logoUrl={branding.logoUrl}
      />

      <MobileMoreMenu
        open={moreOpen}
        onOpenChange={setMoreOpen}
        pathname={pathname}
        unread={unread}
      />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar/95 text-sidebar-foreground backdrop-blur-xl border-t border-gold/20 safe-area-inset">
        <div className="grid grid-cols-5 px-1 py-1.5">
          {mobileNav.map((item) => {
            const active = isActivePath(pathname, item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center gap-0.5 py-2 mx-0.5 rounded-xl text-[10px] font-semibold transition active:scale-95 ${
                  active ? "text-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-b-full bg-gradient-gold" />}
                <div className={`size-9 rounded-xl flex items-center justify-center transition ${active ? "bg-gold/10" : ""}`}>
                  <Icon className={`size-5 transition-transform ${active ? "scale-110" : ""}`} />
                </div>
                <span className="leading-none">{item.label}</span>
                {item.to === "/munasabti-manager/booking-requests" && unread > 0 && (
                  <span className="absolute top-1 left-3 size-2 rounded-full bg-destructive ring-2 ring-background" />
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`relative flex flex-col items-center gap-0.5 py-2 mx-0.5 rounded-xl text-[10px] font-semibold transition active:scale-95 ${
              mobileNav.some((item) => isActivePath(pathname, item.to)) ? "text-muted-foreground" : "text-gold"
            }`}
            aria-label="عرض المزيد من الصفحات"
            aria-expanded={moreOpen}
          >
            {!mobileNav.some((item) => isActivePath(pathname, item.to)) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-b-full bg-gradient-gold" />
            )}
            <div className={`size-9 rounded-xl flex items-center justify-center ${
              !mobileNav.some((item) => isActivePath(pathname, item.to)) ? "bg-gold/10" : ""
            }`}>
              <MoreHorizontal className="size-5" />
            </div>
            <span className="leading-none">المزيد</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function MobileDrawer({ open, onOpenChange, pathname, unread, companyName, logoUrl }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  unread: number;
  companyName: string;
  logoUrl?: string | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" dir="rtl" className="md:hidden w-[88vw] max-w-sm bg-sidebar text-sidebar-foreground border-gold/20 p-0 overflow-y-auto">
        <SheetHeader className="text-right p-5 border-b border-gold/20">
          <div className="flex items-center gap-3 pl-8">
            <div className="size-11 rounded-xl border border-gold/40 bg-sidebar-accent flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? <img src={logoUrl} alt={companyName} className="size-full object-contain" /> : <Crown className="size-5 text-gold" />}
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-gold truncate">{companyName}</SheetTitle>
              <SheetDescription className="text-sidebar-foreground/55">جميع صفحات التطبيق</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <nav className="p-3 space-y-4" aria-label="قائمة الهاتف الرئيسية">
          {groups.map((group, index) => (
            <div key={index}>
              {group.label && <div className="px-3 mb-1.5 text-[10px] font-bold text-sidebar-foreground/45">{group.label}</div>}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.to);
                  return (
                    <Link key={item.to} to={item.to} onClick={() => onOpenChange(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-sidebar-accent text-gold border border-gold/20" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50"}`}>
                      <Icon className="size-[18px] shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge === "notif" && unread > 0 && <span className="min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-center text-[10px] text-destructive-foreground">{unread > 9 ? "9+" : unread}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-gold/20">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10" onClick={() => signOut()}>
            <LogOut className="size-4" /> تسجيل الخروج
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileMoreMenu({ open, onOpenChange, pathname, unread }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  unread: number;
}) {
  const moreItems = groups.flatMap((group) => group.items).filter(
    (item) => !mobileNav.some((mobileItem) => mobileItem.to === item.to),
  );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" dir="rtl" className="md:hidden max-h-[78vh] overflow-y-auto rounded-t-3xl bg-sidebar text-sidebar-foreground border-gold/20 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <SheetHeader className="text-right mb-4">
          <SheetTitle className="text-gold">المزيد</SheetTitle>
          <SheetDescription className="text-sidebar-foreground/55">انتقل إلى أي صفحة في التطبيق</SheetDescription>
        </SheetHeader>
        <nav className="grid grid-cols-2 gap-2" aria-label="المزيد من الصفحات">
          {moreItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.to);
            return (
              <Link key={item.to} to={item.to} onClick={() => onOpenChange(false)} className={`relative flex min-w-0 items-center gap-2.5 rounded-2xl border px-3 py-3.5 text-sm font-semibold transition ${active ? "border-gold/40 bg-sidebar-accent text-gold" : "border-gold/10 bg-sidebar-accent/35 text-sidebar-foreground/80"}`}>
                <Icon className="size-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge === "notif" && unread > 0 && <span className="mr-auto size-2 rounded-full bg-destructive shrink-0" />}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function SidebarItem({ item, active, collapsed, badge }: { item: NavItem; active: boolean; collapsed: boolean; badge: number }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-sidebar-accent text-gold border border-gold/20 shadow-soft"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
      }`}
    >
      {active && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-l-full bg-gradient-gold" />
      )}
      <Icon className={`size-[18px] shrink-0 transition-transform group-hover:scale-110 ${active ? "text-gold" : ""}`} />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && badge > 0 && (
        <span className="text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      {collapsed && badge > 0 && (
        <span className="absolute top-1 left-1 size-2 rounded-full bg-destructive ring-2 ring-[color:var(--sidebar)]" />
      )}
    </Link>
  );
}

function UserCard({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "مستخدم";
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="p-3 border-t border-sidebar-border/40">
      <div className={`rounded-2xl bg-sidebar-accent/40 backdrop-blur flex items-center gap-3 ${
        collapsed ? "p-1.5 justify-center" : "p-2.5"
      }`}>
        <div className="size-10 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold shrink-0 ring-2 ring-gold/15">
          {initial}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{name}</div>
              <div className="text-[11px] text-sidebar-foreground/60 truncate">{user?.email}</div>
            </div>
            <button
              onClick={() => signOut()}
              title="تسجيل الخروج"
              className="size-9 rounded-xl hover:bg-destructive/20 text-sidebar-foreground/70 hover:text-destructive flex items-center justify-center transition shrink-0"
            >
              <LogOut className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Re-exports kept for compatibility
export { isActivePath as _isActivePath };
