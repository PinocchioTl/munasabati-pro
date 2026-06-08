import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listBookingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("booking_requests")
      .select("*")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateBookingRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "accepted" | "rejected" }) => ({
    id: z.string().uuid().parse(d.id),
    status: z.enum(["accepted", "rejected"]).parse(d.status),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("booking_requests")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
