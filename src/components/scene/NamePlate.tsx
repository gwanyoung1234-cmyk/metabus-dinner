"use client";

import { Html } from "@react-three/drei";

export function NamePlate({
  name,
  bubble,
  accent = "#fbbf24",
  height = 2.35,
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
      zIndexRange={[160, 100]}
      style={{
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          transform: "translateY(-6px)",
        }}
      >
        {bubble ? (
          <div
            style={{
              maxWidth: 180,
              borderRadius: 14,
              borderBottomLeftRadius: 4,
              background: "#fff",
              padding: "6px 10px",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.35,
              color: "#292524",
              boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
              whiteSpace: "normal",
              wordBreak: "keep-all",
            }}
          >
            {bubble}
          </div>
        ) : null}
        <div
          style={{
            borderRadius: 999,
            padding: "5px 11px",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: "#fff",
            background: "rgba(0,0,0,0.84)",
            border: `1.5px solid ${accent}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.45)",
          }}
        >
          {name}
        </div>
      </div>
    </Html>
  );
}
