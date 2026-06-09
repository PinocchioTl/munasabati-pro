import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const sectionSchema = z.object({
  id: z.enum(["hero", "about", "gallery", "decorations", "supplies", "contact"]),
  visible: z.boolean(),
});

// Only http(s) URLs allowed; rejects javascript:, data:, vbscript:, etc.
const httpUrl = z
  .string()
  .trim()
  .max(200)
  .refine(
    (v) => v === "" || /^https?:\/\//i.test(v),
    { message: "يجب أن يبدأ الرابط بـ http:// أو https://" },
  )
  .refine(
    (v) => {
      if (!v) return true;
      try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; }
      catch { return false; }
    },
    { message: "رابط غير صالح" },
  );

const socialSchema = z.object({
  instagram: httpUrl.optional().nullable(),
  snapchat: httpUrl.optional().nullable(),
  tiktok: httpUrl.optional().nullable(),
  twitter: httpUrl.optional().nullable(),
  whatsapp: z.string().trim().max(50).regex(/^[+0-9\s-]*$/, "رقم غير صالح").optional().nullable(),
  facebook: httpUrl.optional().nullable(),
}).partial();

const saveSchema = z.object({
  company_name: z.string().trim().max(120).optional().nullable(),
  tagline: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  logo_url: z.string().url().max(500).optional().nullable(),
  cover_url: z.string().url().max(500).optional().nullable(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  background_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  button_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  hero_title: z.string().trim().max(160).optional().nullable(),
  hero_subtitle: z.string().trim().max(200).optional().nullable(),
  hero_description: z.string().trim().max(500).optional().nullable(),
  disabled_message: z.string().trim().max(500).optional().nullable(),
  booking_enabled: z.boolean().optional(),
  show_prices: z.boolean().optional(),
  social_links: socialSchema.optional(),
  sections_config: z.array(sectionSchema).max(20).optional(),
});

export const getMyBuilderConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "public_slug, company_name, tagline, description, phone, logo_url, cover_url, primary_color, secondary_color, accent_color, background_color, button_color, hero_title, hero_subtitle, hero_description, disabled_message, booking_enabled, show_prices, social_links, sections_config"
      )
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? {};
  });

export const saveMyBuilderConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Gallery
const galleryItem = z.object({
  image_url: z.string().url().max(500),
  title: z.string().trim().max(120).optional().nullable(),
  caption: z.string().trim().max(300).optional().nullable(),
});

export const listMyGallery = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data, error } = await supabase
      .from("gallery_images")
      .select("id, image_url, title, caption, sort_order")
      .eq("owner_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => galleryItem.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { count } = await supabase
      .from("gallery_images")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);
    if ((count ?? 0) >= 50) throw new Error("الحد الأقصى 50 صورة في المعرض");
    const { data: row, error } = await supabase
      .from("gallery_images")
      .insert({
        owner_id: userId,
        image_url: data.image_url,
        title: data.title ?? null,
        caption: data.caption ?? null,
        sort_order: count ?? 0,
      })
      .select("id, image_url, title, caption, sort_order")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().trim().max(120).optional().nullable(),
      caption: z.string().trim().max(300).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { error } = await supabase
      .from("gallery_images")
      .update({ title: data.title ?? null, caption: data.caption ?? null })
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { error } = await supabase.from("gallery_images").delete().eq("id", data.id).eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderGallery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ order: z.array(z.string().uuid()).max(100) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await Promise.all(
      data.order.map((id, idx) =>
        supabase.from("gallery_images").update({ sort_order: idx }).eq("id", id).eq("owner_id", userId),
      ),
    );
    return { ok: true };
  });
