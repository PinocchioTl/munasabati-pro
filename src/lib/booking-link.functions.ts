import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{2,39}$/, "أحرف إنجليزية وأرقام وشرطة فقط (3-40)");

/** Get current user's booking link settings + stats */
export const getMyBookingLink = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Ensure profile exists
    await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("public_slug, booking_enabled, link_views, last_visit_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const { count: requestsCount } = await supabase
      .from("booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);

    return {
      public_slug: profile?.public_slug ?? null,
      booking_enabled: profile?.booking_enabled ?? true,
      link_views: profile?.link_views ?? 0,
      last_visit_at: profile?.last_visit_at ?? null,
      bookings_count: requestsCount ?? 0,
    };
  });

/** Check if a slug is available (not used by another tenant). */
export const checkSlugAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => ({ slug: slugSchema.parse(d.slug) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("public_slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { available: !row || row.id === userId };
  });

/** Update slug */
export const updateSlug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => ({ slug: slugSchema.parse(d.slug) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // availability check
    const { data: existing, error: e1 } = await supabase
      .from("profiles")
      .select("id")
      .eq("public_slug", data.slug)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (existing && existing.id !== userId) {
      throw new Error("هذا الرابط مستخدم بالفعل، اختر رابطاً آخر");
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(
        { id: userId, public_slug: data.slug },
        { onConflict: "id" }
      );
    if (error) throw new Error(error.message);
    return { ok: true, slug: data.slug };
  });

/** Toggle booking link enabled state */
export const toggleBookingEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { enabled: boolean }) => ({ enabled: z.boolean().parse(d.enabled) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { id: userId, booking_enabled: data.enabled },
        { onConflict: "id" }
      );
    if (error) throw new Error(error.message);
    return { ok: true, enabled: data.enabled };
  });
