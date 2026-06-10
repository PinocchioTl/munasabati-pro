import { supabase } from "@/integrations/supabase/client";

export const DEMO_EMAIL = "admin@munasabati.test";
export const DEMO_PASSWORD = "Admin123456";

export function isDemoUser(email?: string | null) {
  return (email || "").toLowerCase() === DEMO_EMAIL;
}

async function getOwnerId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("غير مسجل الدخول");
  if (!isDemoUser(data.user.email)) throw new Error("متاح فقط لحساب المطور التجريبي");
  return data.user.id;
}

// ---------- helpers ----------
const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]) => arr[rand(arr.length)];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// Event/decoration themed images via loremflickr (Flickr CC, keyword-driven, deterministic via lock)
const TOPIC_KEYWORDS: Record<string, string> = {
  wedding: "wedding,decoration,reception",
  engagement: "engagement,party,flowers",
  birthday: "birthday,party,balloons",
  graduation: "graduation,ceremony,party",
  baby: "babyshower,party,decoration",
  party: "party,celebration,decoration",
  chair: "chair,banquet,wedding",
  table: "table,banquet,wedding",
  fabric: "wedding,chair,fabric",
  tablecloth: "tablecloth,banquet,wedding",
  flowers: "flowers,bouquet,wedding",
  lights: "chandelier,lights,wedding",
  curtains: "curtain,stage,wedding",
  backdrop: "photobooth,backdrop,wedding",
  speaker: "speaker,event,stage",
  screen: "screen,led,event",
  "party-supply": "party,supplies,celebration",
};
const seedHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
const img = (seed: string | number, w = 800, h = 600) => {
  const s = String(seed);
  const topicKey = Object.keys(TOPIC_KEYWORDS).find((k) => s.startsWith(k)) || "wedding";
  const kw = TOPIC_KEYWORDS[topicKey];
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(kw)}/all?lock=${seedHash(s)}`;
};


const dayOffsetISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// Bulk insert in chunks to avoid request size limits
async function bulkInsert<T extends Record<string, any>>(
  table: string,
  rows: T[],
  chunkSize = 200,
  select?: string,
) {
  const out: any[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const q = supabase.from(table).insert(chunk as any);
    const { data, error } = select ? await q.select(select) : await q.select("id");
    if (error) throw new Error(`[${table}] ${error.message}`);
    if (data) out.push(...data);
  }
  return out;
}

// ---------- profile ----------
async function seedProfile(owner_id: string) {
  await supabase.from("profiles").upsert(
    {
      id: owner_id,
      company_name: "مناسباتي للديكورات الفاخرة",
      tagline: "ديكورات الأعراس والخطوبة والمناسبات الخاصة",
      description:
        "مؤسسة رائدة في تأجير وتنسيق ديكورات الأعراس، الخطوبة، أعياد الميلاد، التخرج، استقبال المواليد وجميع المناسبات الخاصة. نقدّم خدمات احترافية بلمسة فاخرة منذ أكثر من 10 سنوات.",
      phone: "0555000000",
      public_slug: "munasabati-demo",
      booking_enabled: true,
      show_prices: true,
      primary_color: "#5D0A13",
      secondary_color: "#D4AF37",
      accent_color: "#FAF7F2",
      background_color: "#FFFFFF",
      button_color: "#D4AF37",
      logo_url: img("munasabati-logo", 400, 400),
      cover_url: img("munasabati-cover", 1600, 600),
      hero_title: "اجعل مناسبتك لا تُنسى",
      hero_subtitle: "ديكورات فاخرة بلمسة احترافية",
      hero_description:
        "احجز ديكور مناسبتك في أقل من دقيقتين واختر من بين أكثر من 50 ديكوراً حصرياً.",
      social_links: {
        instagram: "https://instagram.com/munasabati",
        facebook: "https://facebook.com/munasabati",
        whatsapp: "https://wa.me/213555000000",
        tiktok: "https://tiktok.com/@munasabati",
      },
    } as any,
    { onConflict: "id" },
  );
}

// ---------- clear ----------
export async function clearDemoData() {
  const owner_id = await getOwnerId();

  const { data: bookings } = await supabase.from("bookings").select("id").eq("owner_id", owner_id);
  const bookingIds = (bookings || []).map((b) => b.id);
  if (bookingIds.length) {
    await supabase.from("booking_decorations").delete().in("booking_id", bookingIds);
    await supabase.from("booking_supplies").delete().in("booking_id", bookingIds);
  }
  const { data: invs } = await supabase.from("invoices").select("id").eq("owner_id", owner_id);
  const invIds = (invs || []).map((i) => i.id);
  if (invIds.length) await supabase.from("invoice_items").delete().in("invoice_id", invIds);

  await supabase.from("invoices").delete().eq("owner_id", owner_id);
  await supabase.from("expenses").delete().eq("owner_id", owner_id);
  await supabase.from("bookings").delete().eq("owner_id", owner_id);
  await supabase.from("booking_requests").delete().eq("owner_id", owner_id);
  await supabase.from("notifications").delete().eq("owner_id", owner_id);
  await supabase.from("gallery_images").delete().eq("owner_id", owner_id);
  await supabase.from("decorations").delete().eq("owner_id", owner_id);
  await supabase.from("supplies").delete().eq("owner_id", owner_id);
  await supabase.from("clients").delete().eq("owner_id", owner_id);
}

// ---------- catalog sources ----------
const DECOR_CATEGORIES = [
  { cat: "أعراس", names: ["مسرح ملكي", "ديكور أبيض كلاسيكي", "ديكور ذهبي فاخر", "مسرح كريستال", "ديكور ورود طبيعية", "مسرح VIP", "ديكور رومانسي", "ديكور أوروبي", "مسرح فضي", "ديكور قصر الأحلام"], topic: "wedding" },
  { cat: "خطوبة", names: ["قوس الزهور الذهبي", "ديكور خطوبة وردي", "ديكور خطوبة كلاسيك", "قوس الورود البيضاء", "ديكور خطوبة فاخر", "ديكور رومانسي", "ديكور قمر العسل", "ديكور حلم"], topic: "engagement" },
  { cat: "أعياد ميلاد", names: ["ديكور باستيل", "بالونات ذهبية", "ديكور أطفال", "ديكور سن 18", "ديكور سن 30", "ديكور وردي للبنات", "ديكور أزرق للأولاد", "ديكور كرتوني"], topic: "birthday" },
  { cat: "تخرج", names: ["ديكور تخرج جامعي", "ديكور تخرج طبي", "ديكور تخرج هندسة", "ديكور تخرج ذهبي", "ديكور تخرج كلاسيكي", "ديكور حفل تخرج"], topic: "graduation" },
  { cat: "استقبال مواليد", names: ["ديكور بيبي بوي", "ديكور بيبي قيرل", "ديكور توأم", "ديكور بالونات سحرية", "ديكور أرنب لطيف", "ديكور سحاب وقمر", "ديكور غيوم"], topic: "baby" },
  { cat: "مناسبات خاصة", names: ["ديكور حفل تقاعد", "ديكور ذكرى زواج", "ديكور حفل شركة", "ديكور رأس السنة", "ديكور حفل عائلي", "ديكور حفل عيد", "ديكور لم شمل", "ديكور مفاجأة"], topic: "party" },
];

const SUPPLY_GROUPS = [
  { cat: "كراسي", names: ["كراسي شيافاري ذهبية", "كراسي شيافاري فضية", "كراسي بلاستيك أبيض", "كراسي خشب ملكية", "كراسي VIP", "كراسي حديد مذهب"], topic: "chair" },
  { cat: "طاولات", names: ["طاولات مستديرة كبيرة", "طاولات مستطيلة", "طاولات كوكتيل", "طاولات بوفيه", "طاولات كيك"], topic: "table" },
  { cat: "أغطية كراسي", names: ["أغطية ساتان أبيض", "أغطية ساتان ذهبي", "أغطية مخمل", "أغطية بشال ذهبي"], topic: "fabric" },
  { cat: "مفارش", names: ["مفارش ساتان أبيض", "مفارش دانتيل ذهبي", "مفارش مخمل أحمر", "مفارش طاولة دائرية"], topic: "tablecloth" },
  { cat: "زهور", names: ["ورود حمراء طبيعية", "ورود بيضاء", "ورود صناعية فاخرة", "تنسيق زهور VIP", "بوكيهات طاولات"], topic: "flowers" },
  { cat: "إضاءة", names: ["ثريات كريستال", "إضاءة LED ملونة", "شموع زجاجية كبيرة", "مصابيح أرضية", "ليزر ملون", "أضواء نيون"], topic: "lights" },
  { cat: "ستائر", names: ["ستائر ساتان بيضاء", "ستائر ذهبية فاخرة", "ستائر LED", "ستائر مخمل"], topic: "curtains" },
  { cat: "منصات تصوير", names: ["خلفية ورود", "خلفية ذهبية", "خلفية بيضاء كلاسيك", "فوتو بوث"], topic: "backdrop" },
  { cat: "صوتيات", names: ["مكبر صوت كبير", "مكبر صوت متوسط", "ميكروفون لاسلكي", "نظام صوت احترافي"], topic: "speaker" },
  { cat: "شاشات", names: ["شاشة LED كبيرة", "شاشة بروجكتور", "شاشة ضيوف"], topic: "screen" },
  { cat: "تجهيزات حفلات", names: ["بالونات هيليوم", "ألعاب نارية باردة", "آلة ضباب", "آلة فقاعات", "آلة كونفيتي"], topic: "party-supply" },
];

const CITIES = ["الجزائر العاصمة", "وهران", "قسنطينة", "عنابة", "البليدة", "تيزي وزو", "سطيف", "باتنة", "بجاية", "تلمسان", "ورقلة", "مستغانم", "غرداية"];
const FIRST_NAMES = ["أحمد", "محمد", "يوسف", "إبراهيم", "خالد", "عمر", "علي", "حسام", "كريم", "بلال", "سامي", "ياسين", "زكريا", "سارة", "فاطمة", "خديجة", "مريم", "نورهان", "ليلى", "أمينة", "هدى", "ياسمين", "إيمان", "وفاء", "نسرين", "هاجر"];
const LAST_NAMES = ["بن علي", "بوضياف", "العربي", "الزهراء", "مرابطي", "حمدي", "بلقاسم", "شريف", "بوزيد", "خليفي", "مهدي", "بومدين", "سعيدي", "بن يوسف", "حداد", "زروقي"];
const HALLS = ["قاعة الأندلس", "قاعة الياسمين", "فندق الأوراسي", "قاعة النخيل", "فيلا خاصة", "قاعة المنار", "قاعة الزهور", "قاعة الأمل", "قاعة الفخامة", "فندق شيراتون", "قاعة قصر الأميرات", "قاعة ألف ليلة"];

export async function seedDemoData() {
  const owner_id = await getOwnerId();
  await clearDemoData();
  await seedProfile(owner_id);

  // ===== Decorations: ~52 =====
  const decoRows: any[] = [];
  DECOR_CATEGORIES.forEach((group, gi) => {
    group.names.forEach((nm, ni) => {
      const total = 2 + rand(8);
      const booked = rand(Math.min(total, 4));
      decoRows.push({
        owner_id,
        name: nm,
        category: group.cat,
        description: `${nm} — تصميم حصري بلمسة احترافية مناسب لـ${group.cat}. تركيب وفك مجاني.`,
        price: 20000 + rand(15) * 5000,
        total_qty: total,
        booked_qty: booked,
        status: booked >= total ? "unavailable" : booked >= total * 0.7 ? "limited" : "available",
        images: range(3 + rand(6)).map((k) => img(`${group.topic}-${gi}-${ni}-${k}`)),
      });
    });
  });
  const decos = await bulkInsert<any>("decorations", decoRows, 100, "id, name, price");

  // ===== Supplies: ~100 (expand by qty variations) =====
  const supplyRows: any[] = [];
  SUPPLY_GROUPS.forEach((g, gi) => {
    g.names.forEach((nm, ni) => {
      // 2 variants per item to reach ~100
      for (let v = 0; v < 2; v++) {
        const total = 30 + rand(200);
        const used = rand(Math.floor(total * 0.8));
        const minAlert = 10 + rand(20);
        supplyRows.push({
          owner_id,
          name: v === 0 ? nm : `${nm} (مجموعة ${v + 1})`,
          category: g.cat,
          notes: `${nm} عالي الجودة، متوفر بكميات كبيرة للحجوزات.`,
          cost: 200 + rand(50) * 100,
          total_qty: total,
          used_qty: used,
          min_alert: minAlert,
          supplier: pick(["مورد المناسبات", "أثاث برو", "نسيج الفخامة", "ديكورات النور", "زهور VIP", "تجهيزات الأحلام"]),
          status: total - used <= minAlert ? "limited" : "available",
          images: range(2 + rand(4)).map((k) => img(`${g.topic}-${gi}-${ni}-${v}-${k}`)),
        });
      }
    });
  });
  await bulkInsert("supplies", supplyRows, 100);

  // ===== Clients: 300 =====
  const clientRows = range(300).map((i) => {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const created = dayOffsetISO(-rand(540));
    return {
      owner_id,
      name,
      phone: `0${5 + rand(3)}${String(10000000 + rand(90000000)).slice(0, 8)}`,
      email: `client${i + 1}@example.com`,
      address: pick(CITIES),
      is_vip: Math.random() < 0.12,
      created_at: created + "T10:00:00Z",
    };
  });
  const clients = await bulkInsert<any>("clients", clientRows, 200, "id, name, phone, is_vip");

  // ===== Bookings: 50 confirmed, 20 pending, 15 completed, 10 cancelled =====
  type Status = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  const statusPlan: Array<{ status: Status; count: number; offsetRange: [number, number] }> = [
    { status: "completed", count: 15, offsetRange: [-180, -10] },
    { status: "cancelled", count: 10, offsetRange: [-150, -5] },
    { status: "confirmed", count: 50, offsetRange: [-30, 120] },
    { status: "pending", count: 20, offsetRange: [1, 90] },
  ];
  const EVENTS = ["wedding", "engagement", "birthday", "graduation", "baby_shower", "other"];

  const bookingRows: any[] = [];
  statusPlan.forEach((plan) => {
    for (let i = 0; i < plan.count; i++) {
      const c = pick(clients);
      const [a, b] = plan.offsetRange;
      const off = a + rand(b - a);
      const total = 40000 + rand(20) * 10000;
      const expenses = Math.round(total * (0.1 + Math.random() * 0.15));
      const transport = 2000 + rand(8) * 1000;
      const deposit =
        plan.status === "completed"
          ? total
          : plan.status === "cancelled"
            ? 0
            : Math.round(total * (0.3 + Math.random() * 0.4));
      const remaining = Math.max(total - deposit, 0);
      bookingRows.push({
        owner_id,
        client_id: c.id,
        customer_name: c.name,
        phone: c.phone,
        event_type: pick(EVENTS),
        event_date: dayOffsetISO(off),
        location: pick(HALLS) + " - " + pick(CITIES),
        start_time: pick(["17:00", "18:00", "19:00", "20:00"]),
        end_time: pick(["22:00", "23:00", "23:30", "00:30"]),
        status: plan.status,
        deposit,
        total_price: total,
        expenses,
        transport_cost: transport,
        remaining,
        net_profit: total - expenses - transport,
        payment_status: deposit === 0 ? "unpaid" : deposit >= total ? "paid" : "partial",
        notes: Math.random() < 0.3 ? "ملاحظات خاصة من الزبون." : null,
      });
    }
  });
  const bookings = await bulkInsert<any>("bookings", bookingRows, 200, "id, total_price, status, event_date");

  // ===== Booking decorations & supplies links =====
  if (bookings.length && decos.length) {
    const bdRows = bookings.flatMap((b) => {
      const n = 1 + rand(3);
      const used = new Set<string>();
      const rows: any[] = [];
      for (let i = 0; i < n; i++) {
        const d = pick(decos);
        if (used.has(d.id)) continue;
        used.add(d.id);
        rows.push({ booking_id: b.id, decoration_id: d.id, qty: 1 });
      }
      return rows;
    });
    await bulkInsert("booking_decorations", bdRows, 300);
  }

  // ===== Expenses =====
  if (bookings.length) {
    const expRows = bookings
      .filter(() => Math.random() < 0.7)
      .flatMap((b) =>
        range(1 + rand(3)).map(() => ({
          owner_id,
          booking_id: b.id,
          expense_type: pick(["نقل", "طعام", "إضافات", "عمالة", "ديكور إضافي", "صيانة"]),
          amount: 2000 + rand(20) * 1000,
          date: b.event_date,
        })),
      );
    await bulkInsert("expenses", expRows, 300);
  }

  // ===== Invoices for ~half =====
  if (bookings.length && clients.length) {
    const invSeed = bookings
      .filter((b) => b.status === "completed" || b.status === "confirmed")
      .slice(0, 40)
      .map((b) => {
        const sub = Number(b.total_price);
        const tax = Math.round(sub * 0.05);
        const total = sub + tax;
        return {
          owner_id,
          booking_id: b.id,
          client_id: null,
          customer_name: pick(clients).name,
          issue_date: b.event_date,
          due_date: dayOffsetISO(0),
          subtotal: sub,
          tax_rate: 5,
          tax_amount: tax,
          discount: 0,
          total,
          paid_amount: b.status === "completed" ? total : Math.round(total / 2),
        };
      });
    const invs = await bulkInsert<any>("invoices", invSeed, 200, "id, subtotal");
    if (invs.length) {
      const itemRows = invs.flatMap((inv) => [
        { invoice_id: inv.id, name: "إيجار ديكور", qty: 1, unit_price: Math.round(Number(inv.subtotal) * 0.7), line_total: Math.round(Number(inv.subtotal) * 0.7), position: 0 },
        { invoice_id: inv.id, name: "خدمات تنسيق", qty: 1, unit_price: Math.round(Number(inv.subtotal) * 0.3), line_total: Math.round(Number(inv.subtotal) * 0.3), position: 1 },
      ]);
      await bulkInsert("invoice_items", itemRows, 300);
    }
  }

  // ===== Gallery images: 24 =====
  const galleryRows = range(24).map((i) => ({
    owner_id,
    image_url: img(`gallery-${i}`, 1200, 800),
    title: `لقطة من حفل ${i + 1}`,
    caption: pick(["ديكور أعراس فاخر", "حفل خطوبة كلاسيكي", "حفل تخرج مميز", "ديكور VIP"]),
    sort_order: i,
  }));
  await bulkInsert("gallery_images", galleryRows, 100);

  // ===== Booking requests: 25 (simulating Munasabati Booking traffic) =====
  const reqStatuses = ["pending", "pending", "pending", "accepted", "accepted", "rejected"];
  const requestRows = range(25).map((i) => {
    const decoSel = range(1 + rand(3)).map(() => {
      const d = pick(decos);
      return { id: d.id, name: d.name, price: Number(d.price), qty: 1 };
    });
    return {
      owner_id,
      customer_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      customer_phone: `0${5 + rand(3)}${String(10000000 + rand(90000000)).slice(0, 8)}`,
      event_date: dayOffsetISO(7 + rand(120)),
      event_location: pick(HALLS) + " - " + pick(CITIES),
      event_type: pick(EVENTS),
      notes: Math.random() < 0.5 ? "أحتاج تأكيد التوفر في أقرب وقت." : null,
      decorations: decoSel,
      supplies: [],
      status: pick(reqStatuses),
      created_at: dayOffsetISO(-rand(20)) + "T12:00:00Z",
    };
  });
  await bulkInsert("booking_requests", requestRows, 100);

  // ===== Notifications: 30 =====
  const notifTemplates = [
    { title: "حجز جديد", body: "تم استلام حجز جديد عبر منصة الحجز", level: "info", kind: "booking" },
    { title: "حجز مؤكد", body: "تم تأكيد الحجز بنجاح", level: "success", kind: "booking" },
    { title: "حجز ملغي", body: "قام الزبون بإلغاء الحجز", level: "warning", kind: "booking" },
    { title: "دفعة مستلمة", body: "تم استلام دفعة جديدة من الزبون", level: "success", kind: "payment" },
    { title: "تنبيه نقص مخزون", body: "مستلزم اقترب من النفاد", level: "warning", kind: "supply" },
    { title: "تذكير حدث قادم", body: "لديك حدث خلال 3 أيام", level: "info", kind: "reminder" },
    { title: "تحديث النظام", body: "تم تحديث النظام إلى أحدث إصدار", level: "info", kind: "system" },
    { title: "طلب حجز جديد", body: "طلب حجز جديد بانتظار المراجعة", level: "info", kind: "request" },
  ];
  const notifRows = range(30).map((i) => ({
    owner_id,
    ...pick(notifTemplates),
    is_read: i > 8,
    created_at: dayOffsetISO(-rand(30)) + "T09:00:00Z",
  }));
  await bulkInsert("notifications", notifRows, 100);
}
