import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{2,39}$/, "slug غير صالح");

/** Resolve a public-enabled tenant by slug. Returns owner_id or throws. */
async function resolveOwner(slug: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, booking_enabled")
    .eq("public_slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !data.booking_enabled) throw new Error("الصفحة غير متوفرة");
  return data.id as string;
}

export const getPublicOwner = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: slugSchema.parse(d.slug) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .select("id, public_slug, company_name, logo_url, cover_url, tagline, description, primary_color, secondary_color, accent_color, background_color, show_prices, booking_enabled, phone")
      .eq("public_slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || !row.booking_enabled) throw new Error("الصفحة غير متوفرة");
    return row;
  });

export const getPublicDecorations = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: slugSchema.parse(d.slug) }))
  .handler(async ({ data }) => {
    const owner_id = await resolveOwner(data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("decorations")
      .select("id, name, category, images, price, total_qty, description")
      .eq("owner_id", owner_id)
      .order("name");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPublicDecoration = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string; id: string }) => ({
    slug: slugSchema.parse(d.slug),
    id: z.string().uuid().parse(d.id),
  }))
  .handler(async ({ data }) => {
    const owner_id = await resolveOwner(data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("decorations")
      .select("id, name, category, images, price, total_qty, description")
      .eq("owner_id", owner_id)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("الديكور غير موجود");
    return row;
  });

export const getPublicSupplies = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: slugSchema.parse(d.slug) }))
  .handler(async ({ data }) => {
    const owner_id = await resolveOwner(data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("supplies")
      .select("id, name, category, images, cost, total_qty, notes")
      .eq("owner_id", owner_id)
      .order("name");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Return decorations + supplies that still have availability on a given date. */
export const getAvailableForDate = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string; date: string }) => ({
    slug: slugSchema.parse(d.slug),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(d.date),
  }))
  .handler(async ({ data }) => {
    const owner_id = await resolveOwner(data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [decRes, supRes, bookingsRes, reqRes] = await Promise.all([
      supabaseAdmin.from("decorations")
        .select("id, name, category, images, price, total_qty, description")
        .eq("owner_id", owner_id).order("name"),
      supabaseAdmin.from("supplies")
        .select("id, name, category, images, cost, total_qty, notes")
        .eq("owner_id", owner_id).order("name"),
      supabaseAdmin.from("bookings")
        .select("id, booking_decorations(decoration_id, qty), booking_supplies(supply_id, qty)")
        .eq("owner_id", owner_id).eq("event_date", data.date)
        .in("status", ["pending", "confirmed", "in_progress"]),
      supabaseAdmin.from("booking_requests")
        .select("decorations, supplies")
        .eq("owner_id", owner_id).eq("event_date", data.date)
        .in("status", ["pending", "accepted"]),
    ]);
    if (decRes.error) throw new Error(decRes.error.message);
    if (supRes.error) throw new Error(supRes.error.message);
    if (bookingsRes.error) throw new Error(bookingsRes.error.message);
    if (reqRes.error) throw new Error(reqRes.error.message);

    const decUsed: Record<string, number> = {};
    const supUsed: Record<string, number> = {};
    for (const b of bookingsRes.data ?? []) {
      for (const i of ((b as any).booking_decorations ?? []))
        decUsed[i.decoration_id] = (decUsed[i.decoration_id] || 0) + (i.qty || 0);
      for (const i of ((b as any).booking_supplies ?? []))
        supUsed[i.supply_id] = (supUsed[i.supply_id] || 0) + (i.qty || 0);
    }
    for (const r of reqRes.data ?? []) {
      for (const i of (((r as any).decorations) ?? []))
        decUsed[i.id] = (decUsed[i.id] || 0) + (i.qty || 0);
      for (const i of (((r as any).supplies) ?? []))
        supUsed[i.id] = (supUsed[i.id] || 0) + (i.qty || 0);
    }

    const decorations = (decRes.data ?? [])
      .map(d => ({ ...d, available: Math.max((d.total_qty || 0) - (decUsed[d.id] || 0), 0) }))
      .filter(d => d.available > 0);
    const supplies = (supRes.data ?? [])
      .map(s => ({ ...s, available: Math.max((s.total_qty || 0) - (supUsed[s.id] || 0), 0) }))
      .filter(s => s.available > 0);

    return { decorations, supplies };
  });

const requestSchema = z.object({
  slug: slugSchema,
  customer_name: z.string().trim().min(2).max(100),
  customer_phone: z.string().trim().min(6).max(30),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_location: z.string().trim().max(200).optional().nullable(),
  event_type: z.string().trim().max(50).default("other"),
  notes: z.string().trim().max(1000).optional().nullable(),
  decorations: z.array(z.object({ id: z.string().uuid(), qty: z.number().int().min(1).max(99) })).max(50).default([]),
  supplies: z.array(z.object({ id: z.string().uuid(), qty: z.number().int().min(1).max(999) })).max(50).default([]),
});

export const submitBookingRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => requestSchema.parse(d))
  .handler(async ({ data }) => {
    const owner_id = await resolveOwner(data.slug);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("booking_requests")
      .insert({
        owner_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        event_date: data.event_date,
        event_location: data.event_location || null,
        event_type: data.event_type || "other",
        notes: data.notes || null,
        decorations: data.decorations,
        supplies: data.supplies,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, ok: true };
  });