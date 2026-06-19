import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Calendar, Package, Wallet, Settings as SettingsIcon, Sparkles, AlertTriangle, CheckCircle2, CheckCheck, Trash2, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/lib/db";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const kindRoute: Record<string, string> = {
  booking: "/munasabti-manager/bookings",
  decoration: "/munasabti-manager/decorations",
  supply: "/munasabti-manager/supplies",
  profit: "/munasabti-manager/profits",
};

const kindStyle: Record<string, { icon: any; bg: string; text: string }> = {
  booking:    { icon: Calendar,  bg: "bg-blue-500/10",    text: "text-blue-500" },
  decoration: { icon: Sparkles,  bg: "bg-violet-500/10",  text: "text-violet-500" },
  supply:     { icon: Package,   bg: "bg-orange-500/10",  text: "text-orange-500" },
  profit:     { icon: Wallet,    bg: "bg-emerald-500/10", text: "text-emerald-500" },
  system:     { icon: SettingsIcon, bg: "bg-muted", text: "text-muted-foreground" },
};

function styleFor(kind?: string | null, level?: string | null) {
  if (kind && kindStyle[kind]) return kindStyle[kind];
  if (level === "warning") return { icon: AlertTriangle, bg: "bg-amber-500/10", text: "text-amber-500" };
  if (level === "error")   return { icon: AlertTriangle, bg: "bg-red-500/10",   text: "text-red-500" };
  if (level === "success") return { icon: CheckCircle2,  bg: "bg-emerald-500/10", text: "text-emerald-500" };
  return kindStyle.system;
}

export function NotificationsBell() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const unread = notifications.filter((n) => !n.is_read).length;

  const trigger = (
    <button
      type="button"
      className="relative size-9 sm:size-10 rounded-xl hover:bg-card flex items-center justify-center transition"
      aria-label="الإشعارات"
      title="الإشعارات"
    >
      <Bell className="size-[18px]" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground flex items-center justify-center px-1 ring-2 ring-background">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );

  if (isMobile) {
    return (
      <>
        <span onClick={() => setOpen(true)}>{trigger}</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            dir="rtl"
            className="max-h-[85vh] rounded-t-3xl bg-background border-gold/20 p-0 overflow-hidden flex flex-col"
          >
            <SheetHeader className="text-right p-4 border-b border-border">
              <SheetTitle className="text-base">الإشعارات</SheetTitle>
              <SheetDescription>{unread > 0 ? `${unread} غير مقروءة` : "كل الإشعارات مقروءة"}</SheetDescription>
            </SheetHeader>
            <NotificationsList notifications={notifications} onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        dir="rtl"
        className="w-[380px] p-0 overflow-hidden border-gold/20"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-sm font-bold">الإشعارات</div>
            <div className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} غير مقروءة` : "كل الإشعارات مقروءة"}
            </div>
          </div>
        </div>
        <NotificationsList notifications={notifications} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function NotificationsList({ notifications, onClose }: { notifications: any[]; onClose: () => void }) {
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const del = useDeleteNotification();
  const unread = notifications.filter((n) => !n.is_read).length;

  const open = (n: any) => {
    if (!n.is_read) markRead.mutate(n.id);
    const route = n.kind && kindRoute[n.kind];
    if (route) {
      onClose();
      navigate({ to: route });
    }
  };

  return (
    <>
      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={unread === 0}
            className="text-[11px] font-semibold text-muted-foreground hover:text-gold disabled:opacity-40 flex items-center gap-1 px-2 py-1 rounded-md transition"
          >
            <CheckCheck className="size-3.5" /> تعليم الكل كمقروء
          </button>
        </div>
      )}
      <div className="overflow-y-auto max-h-[60vh]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-6 text-muted-foreground">
            <Inbox className="size-10 mb-2 opacity-60" />
            <div className="text-sm font-semibold">لا توجد إشعارات</div>
            <div className="text-xs mt-1">ستظهر الإشعارات الجديدة هنا</div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const s = styleFor(n.kind, n.level);
              const Icon = s.icon;
              const time = formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar });
              return (
                <li key={n.id} className={`group relative ${!n.is_read ? "bg-gold/5" : ""}`}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className="w-full text-right flex gap-3 px-3 py-3 hover:bg-muted/40 transition"
                  >
                    <div className={`size-9 rounded-xl shrink-0 flex items-center justify-center ${s.bg} ${s.text}`}>
                      <Icon className="size-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`text-[13px] truncate ${!n.is_read ? "font-bold" : "font-semibold text-foreground/80"}`}>
                          {n.title}
                        </div>
                        {!n.is_read && <span className="size-2 rounded-full bg-gold shrink-0 mt-1.5" />}
                      </div>
                      {n.body && (
                        <div className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>
                      )}
                      <div className="text-[10px] text-muted-foreground/70 mt-1">{time}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); del.mutate(n.id); }}
                    className="absolute top-2 left-2 size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    aria-label="حذف"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
