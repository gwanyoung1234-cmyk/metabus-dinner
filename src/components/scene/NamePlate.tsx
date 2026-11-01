"use client";

import { Html } from "@react-three/drei";

export function NamePlate({
  name,
  bubble,
  accent = "#fbbf24",
  height = 2.55,
}: {
  name: string;
  bubble?: string | null;
  accent?: string;
  height?: number;
}) {
  return (
    <Html
      position={[0, height, 0]}
      center
      distanceFactor={11}
      style={{ pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap" }}
      zIndexRange={[40, 0]}
    >
      <div className="flex -translate-y-2 flex-col items-center gap-1.5">
        {bubble ? (
          <div className="max-w-[11rem] rounded-2xl rounded-bl-sm bg-white px-2.5 py-1.5 text-center text-[11px] font-medium leading-snug text-stone-800 shadow-lg">
            {bubble}
          </div>
        ) : null}
        <div
          className="rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-md"
          style={{ background: "rgba(0,0,0,0.78)", border: `1px solid ${accent}` }}
        >
          {name}
        </div>
      </div>
    </Html>
  );
}
