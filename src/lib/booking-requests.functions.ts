import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const isMissingBookingRequestsTable = (message?: string | null) =>
  Boolean(message?.includes("public.booking_requests") && message?.includes("schema cache"));

export const listBookingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("booking_requests")
      .select("*")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingBookingRequestsTable(error.message)) return [];
      throw new Error(error.message);
    }
    return data ?? [];
  });

export const updateBookingRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "accepted" | "rejected" }) => ({
    id: z.string().uuid().parse(d.id),
    status: z.enum(["accepted", "rejected"]).parse(d.status),
  }))
  .handler(async ({ data, context }) => {
    const { data: req, error: e0 } = await context.supabase
      .from("booking_requests")
      .select("*")
      .eq("id", data.id)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (e0) {
      if (isMissingBookingRequestsTable(e0.message)) {
        throw new Error("جدول طلبات الحجز غير جاهز بعد، أعد المحاولة بعد لحظات.");
      }
      throw new Error(e0.message);
    }
    if (!req) throw new Error("الطلب غير موجود");

    // On accept: create a real confirmed booking + linked items
    if (data.status === "accepted" && (req.status || "pending") !== "accepted") {
      const decs = (req.decorations as any[]) || [];
      const sups = (req.supplies as any[]) || [];
      let total = 0;

      if (decs.length) {
        const { data: ds } = await context.supabase
          .from("decorations").select("id, price").in("id", decs.map(d => d.id));
        for (const it of decs) {
          total += ((ds?.find(x => x.id === it.id)?.price) || 0) * (it.qty || 0);
        }
      }
      if (sups.length) {
        const { data: ss } = await context.supabase
          .from("supplies").select("id, cost").in("id", sups.map(s => s.id));
        for (const it of sups) {
          total += ((ss?.find(x => x.id === it.id)?.cost) || 0) * (it.qty || 0);
        }
      }

      const { data: booking, error: eb } = await context.supabase
        .from("bookings")
        .insert({
          owner_id: context.userId,
          customer_name: req.customer_name,
          phone: req.customer_phone,
          event_type: req.event_type || "other",
          event_date: req.event_date,
          location: req.event_location,
          status: "confirmed",
          total_price: total,
          remaining: total,
          notes: req.notes,
        })
        .select("id")
        .single();
      if (eb) throw new Error(eb.message);

      if (decs.length) {
        const rows = decs.map(d => ({ booking_id: booking.id, decoration_id: d.id, qty: d.qty }));
        const { error: ed } = await context.supabase.from("booking_decorations").insert(rows);
        if (ed) throw new Error(ed.message);
      }
      if (sups.length) {
        const rows = sups.map(s => ({ booking_id: booking.id, supply_id: s.id, qty: s.qty }));
        const { error: es } = await context.supabase.from("booking_supplies").insert(rows);
        if (es) throw new Error(es.message);
      }
    }

    const { error } = await context.supabase
      .from("booking_requests")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) {
      if (isMissingBookingRequestsTable(error.message)) {
        throw new Error("جدول طلبات الحجز غير جاهز بعد، أعد المحاولة بعد لحظات.");
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });
