import { supabase } from "@/integrations/supabase/client";

// All exportable tables. Parents before children — re-insert order matters.
// `profiles` is a single row per user; handled specially (update, not insert).
export const ALL_TABLES = [
  "profiles",
  "event_types",
  "clients",
  "decorations",
  "supplies",
  "gallery_images",
  "bookings",
  "booking_decorations",
  "booking_supplies",
  "booking_requests",
  "invoices",
  "invoice_items",
  "expenses",
  "notifications",
] as const;

export type TableName = (typeof ALL_TABLES)[number];

export type BackupBundle = {
  version: 2;
  exported_at: string;
  app: "munasabati";
  tables: Partial<Record<TableName, any[]>>;
};

export type ImportMode = "merge" | "replace" | "skip";

// Friendly labels for UI
export const TABLE_LABELS: Record<TableName, string> = {
  profiles: "إعدادات النشاط",
  event_types: "أنواع المناسبات",
  clients: "الزبائن",
  decorations: "الديكورات",
  supplies: "المستلزمات",
  gallery_images: "صور المعرض",
  bookings: "الحجوزات",
  booking_decorations: "ديكورات الحجوزات",
  booking_supplies: "مستلزمات الحجوزات",
  booking_requests: "طلبات الحجز",
  invoices: "الفواتير",
  invoice_items: "بنود الفواتير",
  expenses: "المصاريف",
  notifications: "الإشعارات",
};

// Tables the user picks individually. Junctions follow their parents automatically.
export const USER_SELECTABLE: TableName[] = [
  "profiles",
  "event_types",
  "clients",
  "decorations",
  "supplies",
  "gallery_images",
  "bookings",
  "booking_requests",
  "invoices",
  "expenses",
  "notifications",
];

// When user picks parent X, also include its required dependencies/junctions
const AUTO_INCLUDE: Partial<Record<TableName, TableName[]>> = {
  bookings: ["clients", "decorations", "supplies", "booking_decorations", "booking_supplies"],
  invoices: ["invoice_items", "clients"],
  expenses: ["bookings"],
};

export function expandSelection(selected: TableName[]): TableName[] {
  const set = new Set<TableName>(selected);
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of Array.from(set)) {
      for (const dep of AUTO_INCLUDE[t] ?? []) {
        if (!set.has(dep)) { set.add(dep); changed = true; }
      }
    }
  }
  // Preserve canonical order
  return ALL_TABLES.filter(t => set.has(t));
}

export async function exportData(selected: TableName[] = [...USER_SELECTABLE]): Promise<BackupBundle> {
  const tables = expandSelection(selected);
  const bundle: BackupBundle = {
    version: 2,
    exported_at: new Date().toISOString(),
    app: "munasabati",
    tables: {},
  };
  for (const t of tables) {
    const { data, error } = await supabase.from(t as any).select("*");
    if (error) throw new Error(`فشل تصدير ${TABLE_LABELS[t]}: ${error.message}`);
    bundle.tables[t] = data || [];
  }
  return bundle;
}

// Back-compat
export const exportAllData = () => exportData([...USER_SELECTABLE]);

export function downloadBundle(bundle: BackupBundle) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `munasabati-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function summarizeBundle(bundle: BackupBundle): Array<{ table: TableName; label: string; count: number }> {
  return ALL_TABLES
    .filter(t => bundle.tables[t] && (bundle.tables[t] as any[]).length > 0)
    .map(t => ({ table: t, label: TABLE_LABELS[t], count: (bundle.tables[t] as any[]).length }));
}

// Strip auto/computed columns before insert
function strip<T extends Record<string, any>>(row: T, extra: string[] = []): any {
  const drop = new Set([
    "owner_id", "created_at", "updated_at",
    "remaining", "net_profit",
    "bookings_count", "total_revenue",
    "events_count", "total_paid", "last_event_date",
    "link_views", "last_visit_at",
    "booked_qty", "used_qty",
    ...extra,
  ]);
  const out: any = {};
  for (const k of Object.keys(row)) if (!drop.has(k)) out[k] = row[k];
  return out;
}

async function deleteOwn(tables: TableName[]) {
  // Children first
  const order: TableName[] = [
    "invoice_items", "invoices",
    "booking_decorations", "booking_supplies",
    "expenses", "notifications",
    "booking_requests",
    "bookings",
    "gallery_images",
    "decorations", "supplies",
    "clients", "event_types",
  ];
  for (const t of order) {
    if (!tables.includes(t)) continue;
    // Junctions lack id; try id-based delete first
    let err = (await supabase.from(t as any).delete().not("id", "is", null)).error;
    if (err && /column "id"/i.test(err.message)) {
      await supabase.from(t as any).delete().not("booking_id", "is", null);
    }
  }
}

type Remap = Record<string, Map<string, string>>;

async function getExistingNames(table: TableName, field = "name"): Promise<Set<string>> {
  const { data } = await supabase.from(table as any).select(field);
  return new Set((data || []).map((r: any) => (r[field] ?? "").toString().trim().toLowerCase()).filter(Boolean));
}

export function adaptLegacyBundle(raw: any): BackupBundle {
  // v2 already: pass through
  if (raw && raw.tables && typeof raw.tables === "object") return raw as BackupBundle;
  // v1.x: { app, version, data: { customers, decorations, supplies, bookings, invoices, profits, notifications, settings } }
  if (!raw || raw.app !== "munasabati" || !raw.data) {
    throw new Error("ملف غير صالح");
  }
  const d = raw.data || {};
  const tables: Partial<Record<TableName, any[]>> = {};
  if (Array.isArray(d.customers) && d.customers.length) tables.clients = d.customers;
  if (Array.isArray(d.clients) && d.clients.length) tables.clients = d.clients;
  if (Array.isArray(d.decorations) && d.decorations.length) tables.decorations = d.decorations;
  if (Array.isArray(d.supplies) && d.supplies.length) tables.supplies = d.supplies;
  if (Array.isArray(d.notifications) && d.notifications.length) tables.notifications = d.notifications;
  if (Array.isArray(d.invoices) && d.invoices.length) tables.invoices = d.invoices;
  if (Array.isArray(d.expenses) && d.expenses.length) tables.expenses = d.expenses;
  if (Array.isArray(d.profits) && d.profits.length) tables.expenses = d.profits; // legacy alias
  if (d.settings && typeof d.settings === "object") tables.profiles = [d.settings];

  if (Array.isArray(d.bookings) && d.bookings.length) {
    const bks: any[] = [];
    const bd: any[] = [];
    const bs: any[] = [];
    for (const b of d.bookings) {
      const items = b.items || {};
      const { items: _i, ...rest } = b;
      bks.push(rest);
      for (const x of items.decorations || []) bd.push({ booking_id: b.id, decoration_id: x.id, qty: x.qty || 1 });
      for (const x of items.supplies || []) bs.push({ booking_id: b.id, supply_id: x.id, qty: x.qty || 1 });
    }
    tables.bookings = bks;
    if (bd.length) tables.booking_decorations = bd;
    if (bs.length) tables.booking_supplies = bs;
  }

  return {
    version: 2,
    exported_at: raw.export_date || new Date().toISOString(),
    app: "munasabati",
    tables,
  };
}

export async function importBundle(rawBundle: any, mode: ImportMode): Promise<Record<string, number>> {
  const bundle = adaptLegacyBundle(rawBundle);
  if (!bundle || bundle.app !== "munasabati" || !bundle.tables) {
    throw new Error("ملف غير صالح");
  }


  // Current user — required for owner_id on every insert (RLS)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول لاستيراد النسخة الاحتياطية");
  const ownerId = user.id;

  const present = ALL_TABLES.filter(t => Array.isArray(bundle.tables[t]) && (bundle.tables[t] as any[]).length > 0);

  if (mode === "replace") {
    // Delete only tables included in this bundle (don't touch others)
    await deleteOwn(present.filter(t => t !== "profiles"));
  }

  const stats: Record<string, number> = {};
  const remap: Remap = {
    event_types: new Map(),
    clients: new Map(),
    decorations: new Map(),
    supplies: new Map(),
    bookings: new Map(),
    invoices: new Map(),
  };

  // profiles: update single row for current user
  if (bundle.tables.profiles?.length) {
    const src = bundle.tables.profiles[0];
    const payload = strip(src, ["id", "public_slug"]); // never overwrite our slug or id
    const { error } = await supabase.from("profiles").update(payload).eq("id", ownerId);
    if (!error) stats.profiles = 1;
  }

  // Helper: insert a row, remap id; respect "skip" mode by name when possible
  async function insertOne(
    table: keyof Remap,
    row: any,
    dedupeField?: string,
    existing?: Set<string>,
  ): Promise<void> {
    const oldId = row.id;
    if (mode === "skip" && dedupeField && existing) {
      const key = (row[dedupeField] ?? "").toString().trim().toLowerCase();
      if (key && existing.has(key)) return;
    }
    const payload = { ...strip(row, ["id"]), owner_id: ownerId };
    const { data, error } = await supabase.from(table as any).insert(payload).select("id").single();
    if (error) throw new Error(`${TABLE_LABELS[table as TableName]}: ${error.message}`);
    const newId = (data as any)?.id;
    if (oldId && newId) remap[table].set(oldId, newId);
    stats[table] = (stats[table] || 0) + 1;
  }


  // event_types, clients, decorations, supplies (parents)
  for (const t of ["event_types", "clients", "decorations", "supplies"] as const) {
    const rows = bundle.tables[t] || [];
    if (!rows.length) continue;
    const existing = mode === "skip" ? await getExistingNames(t) : undefined;
    for (const r of rows) await insertOne(t, r, "name", existing);
  }

  // gallery_images
  if (bundle.tables.gallery_images?.length) {
    for (const g of bundle.tables.gallery_images) {
      const payload = { ...strip(g, ["id"]), owner_id: ownerId };
      const { error } = await supabase.from("gallery_images").insert(payload);
      if (!error) stats.gallery_images = (stats.gallery_images || 0) + 1;
    }
  }

  // bookings (remap client_id)
  if (bundle.tables.bookings?.length) {
    const existing = mode === "skip" ? await getExistingNames("bookings", "code") : undefined;
    for (const b of bundle.tables.bookings) {
      const mapped = {
        ...b,
        client_id: b.client_id ? remap.clients.get(b.client_id) ?? null : null,
      };
      await insertOne("bookings", mapped, "code", existing);
    }
  }

  // booking_decorations / booking_supplies (junctions)
  for (const bd of bundle.tables.booking_decorations || []) {
    const booking_id = remap.bookings.get(bd.booking_id);
    const decoration_id = remap.decorations.get(bd.decoration_id);
    if (!booking_id || !decoration_id) continue;
    const { error } = await supabase.from("booking_decorations").insert({ booking_id, decoration_id, qty: bd.qty || 1, owner_id: ownerId } as any);
    if (!error) stats.booking_decorations = (stats.booking_decorations || 0) + 1;
  }
  for (const bs of bundle.tables.booking_supplies || []) {
    const booking_id = remap.bookings.get(bs.booking_id);
    const supply_id = remap.supplies.get(bs.supply_id);
    if (!booking_id || !supply_id) continue;
    const { error } = await supabase.from("booking_supplies" as any).insert({ booking_id, supply_id, qty: bs.qty || 1, owner_id: ownerId });
    if (!error) stats.booking_supplies = (stats.booking_supplies || 0) + 1;
  }

  // booking_requests (standalone — no FK remap needed)
  for (const br of bundle.tables.booking_requests || []) {
    const payload = { ...strip(br, ["id"]), owner_id: ownerId };
    const { error } = await supabase.from("booking_requests").insert(payload);
    if (!error) stats.booking_requests = (stats.booking_requests || 0) + 1;
  }

  // invoices (remap booking_id, client_id) + invoice_items
  if (bundle.tables.invoices?.length) {
    for (const inv of bundle.tables.invoices) {
      const mapped = {
        ...inv,
        booking_id: inv.booking_id ? remap.bookings.get(inv.booking_id) ?? null : null,
        client_id: inv.client_id ? remap.clients.get(inv.client_id) ?? null : null,
      };
      await insertOne("invoices", mapped);
    }
  }
  for (const it of bundle.tables.invoice_items || []) {
    const invoice_id = remap.invoices.get(it.invoice_id);
    if (!invoice_id) continue;
    const payload = { ...strip({ ...it, invoice_id }, ["id"]), owner_id: ownerId };
    const { error } = await supabase.from("invoice_items").insert(payload);
    if (!error) stats.invoice_items = (stats.invoice_items || 0) + 1;
  }

  // expenses (remap booking_id)
  for (const e of bundle.tables.expenses || []) {
    const payload = {
      ...strip({ ...e, booking_id: e.booking_id ? remap.bookings.get(e.booking_id) ?? null : null }, ["id"]),
      owner_id: ownerId,
    };
    const { error } = await supabase.from("expenses").insert(payload);
    if (!error) stats.expenses = (stats.expenses || 0) + 1;
  }

  // notifications
  for (const n of bundle.tables.notifications || []) {
    const payload = { ...strip(n, ["id"]), owner_id: ownerId };
    const { error } = await supabase.from("notifications").insert(payload);
    if (!error) stats.notifications = (stats.notifications || 0) + 1;
  }

  return stats;
}

