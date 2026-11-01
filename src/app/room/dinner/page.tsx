"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route → 부어치킨 채널 */
export default function DinnerRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/room/boor");
  }, [router]);
  return (
    <main className="grid min-h-full place-items-center text-amber-100/70">
      부어치킨 채널로 이동 중...
    </main>
  );
}
