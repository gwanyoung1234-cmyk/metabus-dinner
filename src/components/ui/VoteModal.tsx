"use client";

import type { VoteState } from "@/types/presence";

export function VoteModal({
  open,
  vote,
  onClose,
  onVote,
}: {
  open: boolean;
  vote: VoteState;
  onClose: () => void;
  onVote: (choice: "yes" | "no") => void;
}) {
  if (!open) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-amber-800/50 bg-[#1c140f] p-5 text-amber-50 shadow-2xl">
        <h2 className="text-lg font-semibold">강제 2차 투표</h2>
        <p className="mt-2 text-sm text-amber-100/70">
          민주주의처럼 보이지만, 결과는 대체로 2차입니다.
        </p>
        <p className="mt-4 text-sm">
          찬성 {vote.yes} · 반대 {vote.no}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onVote("yes")}
            className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-stone-950"
          >
            찬성
          </button>
          <button
            type="button"
            onClick={() => onVote("no")}
            className="rounded-xl border border-amber-700 px-3 py-2 text-sm font-semibold"
          >
            반대
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-xs text-amber-200/60"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
