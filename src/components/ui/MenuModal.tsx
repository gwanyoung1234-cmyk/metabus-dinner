"use client";

import type { MenuItem, MenuId } from "@/lib/menu";

export function MenuModal({
  open,
  title = "메뉴 주문",
  brand = "MENU",
  items,
  onClose,
  onOrder,
}: {
  open: boolean;
  title?: string;
  brand?: string;
  items: MenuItem[];
  onClose: () => void;
  onOrder: (menuId: MenuId) => void;
}) {
  if (!open) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-800/50 bg-[#1c140f] p-5 text-amber-50 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.18em] text-fuchsia-300/90">{brand}</p>
            <h2 className="mt-1 text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-xs text-amber-100/65">
              앉은 자리에서만 주문할 수 있어요. 알바가 가져다줍니다.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xs text-amber-200/60">
            닫기
          </button>
        </div>
        <ul className="mt-4 grid gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOrder(item.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-amber-900/50 bg-black/35 px-3 py-3 text-left transition hover:border-amber-600/60 hover:bg-amber-950/40"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-black/40 text-lg">
                  {item.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.name}</span>
                  <span className="block text-xs text-amber-100/60">{item.blurb}</span>
                </span>
                <span className="text-xs font-semibold text-orange-300">주문</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
