"use client";

export function ActionBar({
  seated,
  showGrill,
  onSitNearest,
  onLeaveSeat,
  onToast,
  onGrill,
  onOpenMenu,
  onOpenVote,
}: {
  seated: boolean;
  showGrill?: boolean;
  onSitNearest: () => void;
  onLeaveSeat: () => void;
  onToast: () => void;
  onGrill?: () => void;
  onOpenMenu: () => void;
  onOpenVote: () => void;
}) {
  const btn =
    "rounded-xl border border-amber-800/50 bg-black/45 px-3 py-2.5 text-xs font-semibold text-amber-50 backdrop-blur hover:bg-amber-900/40 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="pointer-events-auto flex flex-wrap justify-center gap-2 rounded-2xl border border-amber-900/40 bg-[rgba(18,12,8,0.82)] p-3 shadow-xl">
      <button type="button" className={btn} onPointerDown={seated ? onLeaveSeat : onSitNearest}>
        {seated ? "일어서기" : "가까운 자리 앉기"}
      </button>
      <button type="button" className={btn} disabled={!seated} onPointerDown={onOpenMenu}>
        메뉴 주문
      </button>
      {showGrill ? (
        <button type="button" className={btn} disabled={!seated} onPointerDown={onGrill}>
          고기 굽기
        </button>
      ) : null}
      <button type="button" className={btn} disabled={!seated} onPointerDown={onToast}>
        건배 짠!
      </button>
      <button type="button" className={btn} onPointerDown={onOpenVote}>
        2차 투표
      </button>
    </div>
  );
}
