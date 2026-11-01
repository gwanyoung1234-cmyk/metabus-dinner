"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { PlayerGender } from "@/types/presence";

export default function LobbyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<PlayerGender>("male");

  function handleEnter(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim().slice(0, 12);
    if (!trimmed) return;
    sessionStorage.setItem("metabus-name", trimmed);
    sessionStorage.setItem("metabus-gender", gender);
    router.push("/room/dinner");
  }

  return (
    <main className="relative flex min-h-full items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(192,38,211,0.18),transparent_35%),radial-gradient(circle_at_75%_70%,rgba(180,83,9,0.28),transparent_40%),linear-gradient(180deg,#2a1a14_0%,#120e0b_55%,#0a0807_100%)]" />
      <section className="relative w-full max-w-lg rounded-3xl border border-orange-900/40 bg-[rgba(22,14,10,0.88)] p-8 shadow-2xl backdrop-blur">
        <p className="text-sm font-medium tracking-[0.22em] text-fuchsia-300/90">
          BOOR CHICKEN
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-amber-50">
          부어치킨 회식홀
        </h1>
        <p className="mt-3 text-sm leading-6 text-amber-100/70">
          닉네임과 성별을 고르고 입장하세요. 앉아서 주문하면 알바가 가져다줍니다.
        </p>
        <form onSubmit={handleEnter} className="mt-8 space-y-5">
          <label className="block text-xs font-medium text-amber-200/80">
            닉네임
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={12}
              placeholder="예: 야근요정"
              className="mt-2 w-full rounded-xl border border-amber-800/60 bg-black/30 px-4 py-3 text-base text-amber-50 outline-none ring-orange-500 placeholder:text-amber-100/30 focus:ring-2"
            />
          </label>

          <fieldset>
            <legend className="text-xs font-medium text-amber-200/80">캐릭터</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                  gender === "male"
                    ? "border-sky-400 bg-sky-500/20 text-sky-100"
                    : "border-amber-900/50 bg-black/30 text-amber-100/70 hover:bg-amber-950/40"
                }`}
              >
                남자
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                  gender === "female"
                    ? "border-rose-400 bg-rose-500/20 text-rose-100"
                    : "border-amber-900/50 bg-black/30 text-amber-100/70 hover:bg-amber-950/40"
                }`}
              >
                여자
              </button>
            </div>
          </fieldset>

          <button
            type="submit"
            className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-orange-400"
          >
            부어치킨 본점 입장
          </button>
        </form>
      </section>
    </main>
  );
}
