
## الهدف
تحويل صفحة الحجز العامة `/munasabti-booking/{slug}` من تبويبات تقليدية إلى **معالج حجز (Wizard) حديث من 6 خطوات** بتجربة Mobile-first تنافس منصات الحجز العالمية.

## التغييرات الرئيسية

### 1. صفحة الهبوط (Landing) — `munasabti-booking.$slug.index.tsx`
- Hero بصورة غلاف كبيرة + شعار + اسم النشاط + Tagline
- شارات ثقة (عدد المناسبات المنجزة، عدد العملاء، سنوات الخبرة) — تُحسب من جدول `bookings` عبر server function جديدة `getPublicStats`
- زر CTA ضخم "ابدأ الحجز" → ينتقل لـ `/munasabti-booking/{slug}/book`
- قسم معرض صور مصغّر + قسم "لماذا نحن"
- أزرار عائمة: اتصال مباشر + WhatsApp

### 2. معالج الحجز الجديد — مسار واحد `munasabti-booking.$slug.book.tsx`
بدلاً من 3 صفحات منفصلة (decorations/supplies/request)، صفحة Stepper واحدة بحالة محلية:

```text
[1 تاريخ] → [2 ديكورات] → [3 مستلزمات] → [4 ملخص] → [5 بيانات العميل] → [6 مراجعة وإرسال]
```

- شريط تقدم علوي يوضح الخطوة الحالية
- ملخص حي ثابت (Sticky) أسفل الشاشة على الموبايل / جانبي على الديسكتوب يعرض: التاريخ، العناصر، الإجمالي
- لا تظهر العناصر إلا بعد اختيار التاريخ
- استخدام `getAvailableForDate` الموجودة لجلب المتوفر فقط
- بطاقات حديثة بصور كبيرة + Lightbox للمعرض (سحب بين الصور، Full screen)
- اختيار كمية inline على البطاقة
- في الخطوة الأخيرة، استدعاء `submitBookingRequest` الموجودة + شاشة نجاح أنيقة

### 3. Lightbox للصور
مكوّن جديد `BookingImageLightbox.tsx` مع:
- Full screen overlay
- التنقل بين الصور (سحب على اللمس + أسهم على الديسكتوب)
- Lazy loading + `loading="lazy"` + `decoding="async"`

### 4. أزرار عائمة (FAB)
- اتصال مباشر `tel:`
- WhatsApp `wa.me/`
- مرئية في كل خطوات المعالج

### 5. صفحات بديلة (للروابط القديمة)
الإبقاء على `decorations`, `supplies`, `request` كـ redirects للمعالج الجديد حتى لا تتعطل الروابط المنشورة.

### 6. تعزيز التخصيص في Manager
بالفعل يوجد `booking-page-builder` — إضافة الحقول الناقصة فقط:
- `hero_stats` (events_count, customers_count, years_experience) كـ JSONB على `profiles`
- `whatsapp_number`

## التفاصيل التقنية

**ملفات جديدة:**
- `src/routes/munasabti-booking.$slug.book.tsx` — المعالج
- `src/components/booking/BookingWizard.tsx` — منطق الخطوات
- `src/components/booking/StepDate.tsx`, `StepDecorations.tsx`, `StepSupplies.tsx`, `StepCustomer.tsx`, `StepReview.tsx`
- `src/components/booking/LiveSummary.tsx` — الملخص الحي
- `src/components/booking/ImageLightbox.tsx`
- `src/components/booking/TrustBadges.tsx`
- `src/components/booking/FloatingContact.tsx`

**ملفات معدّلة:**
- `src/routes/munasabti-booking.$slug.index.tsx` — صفحة هبوط جديدة
- `src/routes/munasabti-booking.$slug.tsx` — تبسيط الـ shell (إزالة شريط التبويبات، الاكتفاء بـ header)
- `src/routes/munasabti-booking.$slug.{decorations,supplies,request}.tsx` — redirect للمعالج
- `src/lib/booking-public.functions.ts` — إضافة `getPublicStats`
- `src/routes/_main.munasabti-manager.booking-page-builder.tsx` — حقول stats + whatsapp

**Migration:** إضافة `hero_stats jsonb`, `whatsapp_number text` على `profiles`.

**التزامات:**
- RTL + الحفاظ على نظام الألوان الحالي (`--bk-primary`, `--bk-gold`, `--bk-bg`, `--bk-button`)
- جميع الصور بـ `loading="lazy"` و`decoding="async"`
- لا تغيير على business logic أو RLS
- الحفاظ على إنفاذ `show_prices` server-side
- التحقق من إدخال العميل بنفس schema الحالي

## ما لن أفعله
- لن أغيّر منطق الحجز/الديكورات/المستلزمات في لوحة الإدارة
- لن ألمس RLS أو هيكل الحجوزات
- لن أضيف اعتمادات جديدة (Lightbox مخصص بدون مكتبة)

هل أبدأ التنفيذ؟
