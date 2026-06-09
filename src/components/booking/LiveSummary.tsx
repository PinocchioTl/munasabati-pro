import { CalendarDays, ShoppingBag, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

export type SummaryItem = { id: string; name: string; qty: number; unitPrice?: number };

export function LiveSummary({
  date,
  decorations,
  supplies,
  total,
  showPrices,
  currency = "د.ج",
}: {
  date?: string;
  decorations: SummaryItem[];
  supplies: SummaryItem[];
  total: number;
  showPrices: boolean;
  currency?: string;
}) {
  const [open, setOpen] = useState(false);
  const count = decorations.length + supplies.length;

  if (!date && count === 0) return null;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block sticky top-24 self-start w-full max-w-xs">
        <div className="bg-white rounded-2xl shadow-lg border bk-border-gold/40 p-5">
          <Header date={date} count={count} />
          <Body decorations={decorations} supplies={supplies} showPrices={showPrices} currency={currency} />
          {showPrices && count > 0 && <Total total={total} currency={currency} />}
        </div>
      </aside>

      {/* Mobile collapsible bottom bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t shadow-2xl print:hidden">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full px-4 py-3 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 text-right min-w-0 flex-1">
            <div className="size-9 rounded-full bk-gold flex items-center justify-center shrink-0">
              <ShoppingBag className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-gray-500">طلبك</div>
              <div className="text-sm font-bold bk-text-primary truncate">
                {count > 0 ? `${count} عنصر` : "لم تختر بعد"}
                {date && <span className="text-gray-400 font-normal text-xs mr-1"> · {date}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showPrices && count > 0 && (
              <span className="text-sm font-bold bk-text-gold">
                {new Intl.NumberFormat("ar-DZ").format(total)} {currency}
              </span>
            )}
            {open ? <ChevronDown className="size-4 text-gray-400" /> : <ChevronUp className="size-4 text-gray-400" />}
          </div>
        </button>
        {open && (
          <div className="max-h-[50vh] overflow-y-auto px-4 pb-4 border-t">
            <Body decorations={decorations} supplies={supplies} showPrices={showPrices} currency={currency} />
            {showPrices && count > 0 && <Total total={total} currency={currency} />}
          </div>
        )}
      </div>
    </>
  );
}

function Header({ date, count }: { date?: string; count: number }) {
  return (
    <div className="mb-4 pb-3 border-b">
      <div className="text-xs text-gray-500 mb-1">ملخص الطلب</div>
      <div className="font-bold bk-text-primary flex items-center gap-2 text-sm">
        <CalendarDays className="size-4 bk-text-gold" />
        {date || "اختر التاريخ"}
      </div>
      <div className="text-xs text-gray-500 mt-1">{count} عنصر</div>
    </div>
  );
}

function Body({ decorations, supplies, showPrices, currency }: {
  decorations: SummaryItem[]; supplies: SummaryItem[]; showPrices: boolean; currency: string;
}) {
  if (decorations.length === 0 && supplies.length === 0) {
    return <div className="text-xs text-gray-400 text-center py-6">لم يتم اختيار أي عناصر بعد</div>;
  }
  return (
    <div className="space-y-3">
      {decorations.length > 0 && (
        <SummaryGroup title="ديكورات" items={decorations} showPrices={showPrices} currency={currency} />
      )}
      {supplies.length > 0 && (
        <SummaryGroup title="مستلزمات" items={supplies} showPrices={showPrices} currency={currency} />
      )}
    </div>
  );
}

function SummaryGroup({ title, items, showPrices, currency }: {
  title: string; items: SummaryItem[]; showPrices: boolean; currency: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{title}</div>
      <ul className="space-y-1.5">
        {items.map(it => (
          <li key={it.id} className="flex items-center justify-between text-xs gap-2">
            <span className="truncate text-gray-700 flex-1">
              {it.name} <span className="text-gray-400">× {it.qty}</span>
            </span>
            {showPrices && it.unitPrice !== undefined && (
              <span className="bk-text-gold font-bold shrink-0">
                {new Intl.NumberFormat("ar-DZ").format(it.unitPrice * it.qty)} {currency}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Total({ total, currency }: { total: number; currency: string }) {
  return (
    <div className="mt-4 pt-3 border-t flex items-center justify-between">
      <span className="text-xs font-bold bk-text-primary">الإجمالي التقريبي</span>
      <span className="text-base font-bold bk-text-gold">
        {new Intl.NumberFormat("ar-DZ").format(total)} {currency}
      </span>
    </div>
  );
}
