import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getMyRoles, getPlatformStats } from "@/lib/admin.functions";
import { Card, SectionHeader, LoadingState } from "@/components/ui-bits";
import { Building2, CalendarDays, Inbox, Sparkles, Package, Users, Shield } from "lucide-react";

export const Route = createFileRoute("/_main/munasabti-admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getMyRoles(),
  });
  const isAdmin = roles?.includes("platform_admin") ?? false;

  useEffect(() => {
    if (!rolesLoading && !isAdmin) navigate({ to: "/munasabti-manager" });
  }, [rolesLoading, isAdmin, navigate]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => getPlatformStats(),
    enabled: isAdmin,
  });

  if (rolesLoading || !isAdmin) return <LoadingState />;

  const cards = [
    { label: "أصحاب الديكورات", value: stats?.tenants, icon: Building2 },
    { label: "الحجوزات", value: stats?.bookings, icon: CalendarDays },
    { label: "طلبات الرابط", value: stats?.booking_requests, icon: Inbox },
    { label: "الديكورات", value: stats?.decorations, icon: Sparkles },
    { label: "المستلزمات", value: stats?.supplies, icon: Package },
    { label: "الزبائن", value: stats?.clients, icon: Users },
  ];

  return (
    <div dir="rtl" className="space-y-6">
      <SectionHeader
        icon={<Shield className="size-5" />}
        title="Platform Admin"
        subtitle="إحصائيات عامة عبر المنصة — لا تتضمن بيانات أي صاحب ديكور"
      />
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Card key={c.label} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-semibold">{c.label}</span>
                <c.icon className="size-4 text-gold" />
              </div>
              <div className="text-3xl font-bold text-gradient-gold">{c.value ?? 0}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
