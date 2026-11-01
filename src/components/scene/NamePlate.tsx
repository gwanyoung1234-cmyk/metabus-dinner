"use client";

import { Html } from "@react-three/drei";

export function NamePlate({
  name,
  bubble,
  accent = "#fbbf24",
}: {
  name: string;
  bubble?: string | null;
  accent?: string;
}) {
  return (
    <Html
      position={[0, 1.55, 0]}
      center
      distanceFactor={8}
      style={{ pointerEvents: "none", userSelect: "none" }}
      zIndexRange={[20, 0]}
    >
      <div className="flex flex-col items-center gap-1">
        {bubble ? (
          <div className="max-w-[10rem] rounded-2xl rounded-bl-sm bg-white px-2.5 py-1.5 text-center text-[11px] font-medium leading-snug text-stone-800 shadow-lg">
            {bubble}
          </div>
        ) : null}
        <div
          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md"
          style={{ background: "rgba(0,0,0,0.72)", border: `1px solid ${accent}` }}
        >
          {name}
        </div>
      </div>
    </Html>
  );
}
