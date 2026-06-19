import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card, SectionHeader, Button, LoadingState, StatusBadge } from "@/components/ui-bits";
import { ShareBookingLinkModal } from "@/components/ShareBookingLinkModal";
import { eventTypeLabels } from "@/lib/db";
import { listBookingRequests, updateBookingRequestStatus } from "@/lib/booking-requests.functions";
import { Inbox, Check, X, Share2, Phone, Calendar, MapPin, Clock } from "lucide-react";
import { formatDateLong, formatDateTime } from "@/lib/date-format";

export const Route = createFileRoute("/_main/munasabti-manager/booking-requests")({
  component: BookingRequestsPage,
  errorComponent: BookingRequestsError,
});

function BookingRequestsError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <Card className="p-8 text-center space-y-4">
      <div className="mx-auto size-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
        <Inbox className="size-6" />
      </div>
      <div>
        <p className="font-bold">تعذر تحميل طلبات الحجز</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
      <Button
        variant="gold"
        onClick={() => {
          router.invalidate();
          reset();
        }}
      >
        إعادة المحاولة
      </Button>
    </Card>
  );
}

function BookingRequestsPage() {
  const fetchList = useServerFn(listBookingRequests);
  const updateStatus = useServerFn(updateBookingRequestStatus);
  const qc = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("pending");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["booking-requests"],
    queryFn: () => fetchList(),
  });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: "accepted" | "rejected" }) =>
      updateStatus({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(vars.status === "accepted" ? "تم قبول الطلب" : "تم رفض الطلب");
      qc.invalidateQueries({ queryKey: ["booking-requests"] });
    },
    onError: (e: any) => toast.error(e?.message || "حدث خطأ"),
  });

  const filtered = requests.filter((r: any) =>
    filter === "all" ? true : (r.status || "pending") === filter
  );

  const tabs = [
    { id: "pending", label: "قيد المراجعة" },
    { id: "accepted", label: "مقبولة" },
    { id: "rejected", label: "مرفوضة" },
    { id: "all", label: "الكل" },
  ] as const;

  return (
    <div className="space-y-4 lg:space-y-6 animate-slide-up">
      <SectionHeader
        title="طلبات الحجز عبر الرابط"
        subtitle="جميع الطلبات الواردة من رابط الحجز الخاص بك"
        action={
          <Button variant="gold" onClick={() => setShareOpen(true)}>
            <Share2 className="size-4" /> مشاركة الرابط
          </Button>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              filter === t.id
                ? "bg-gradient-gold text-primary shadow-gold"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto size-14 rounded-2xl bg-secondary/60 flex items-center justify-center text-muted-foreground mb-3">
            <Inbox className="size-6" />
          </div>
          <p className="font-bold">لا توجد طلبات</p>
          <p className="text-sm text-muted-foreground mt-1">شارك رابط الحجز ليصلك طلبات من زبائنك</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
          {filtered.map((r: any) => (
            <RequestCard
              key={r.id}
              req={r}
              onAccept={() => mut.mutate({ id: r.id, status: "accepted" })}
              onReject={() => mut.mutate({ id: r.id, status: "rejected" })}
              busy={mut.isPending}
            />
          ))}
        </div>
      )}

      <ShareBookingLinkModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}

function RequestCard({ req, onAccept, onReject, busy }: any) {
  const status = (req.status || "pending") as "pending" | "accepted" | "rejected";
  const created = req.created_at ? new Date(req.created_at).toLocaleString("ar-DZ") : "";
  return (
    <Card className="p-4 lg:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold truncate">{req.customer_name}</div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="size-3" /> {created}
          </div>
        </div>
        <StatusBadge status={status === "accepted" ? "confirmed" : status === "rejected" ? "cancelled" : "pending"} />
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="size-3.5 shrink-0" />
          <a href={`tel:${req.customer_phone}`} className="text-foreground font-medium" dir="ltr">{req.customer_phone}</a>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" />
          <span className="text-foreground">{req.event_date}</span>
          <span>•</span>
          <span>{eventTypeLabels[req.event_type] || req.event_type}</span>
        </div>
        {req.event_location && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="text-foreground truncate">{req.event_location}</span>
          </div>
        )}
      </div>

      {(req.decorations?.length || req.supplies?.length) ? (
        <div className="text-xs text-muted-foreground border-t border-border/60 pt-2">
          {req.decorations?.length ? `${req.decorations.length} ديكور` : ""}
          {req.decorations?.length && req.supplies?.length ? " • " : ""}
          {req.supplies?.length ? `${req.supplies.length} مستلزم` : ""}
        </div>
      ) : null}

      {req.notes && (
        <div className="text-xs bg-secondary/40 rounded-lg p-2.5 text-muted-foreground line-clamp-3">
          {req.notes}
        </div>
      )}

      {status === "pending" && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="gold" size="sm" onClick={onAccept} disabled={busy} className="w-full">
            <Check className="size-4" /> قبول
          </Button>
          <Button variant="outline" size="sm" onClick={onReject} disabled={busy} className="w-full">
            <X className="size-4" /> رفض
          </Button>
        </div>
      )}
    </Card>
  );
}
