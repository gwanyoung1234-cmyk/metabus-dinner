"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { RAISED_PLATFORM_Y } from "@/lib/seats";

/** Local-only gag NPC — not synced over Socket.IO. */
export function BossNpc() {
  const body = useRef<Group>(null);
  const y = RAISED_PLATFORM_Y;
  const waypoints = useMemo(
    () => [
      [-7.5, y, -9.2] as const,
      [0, y, -10.6] as const,
      [7.5, y, -9.2] as const,
      [0, y, -10.6] as const,
    ],
    [y],
  );
  const progress = useRef(0);

  useFrame((_state, delta) => {
    if (!body.current) return;
    progress.current = (progress.current + delta * 0.12) % waypoints.length;
    const i = Math.floor(progress.current);
    const next = (i + 1) % waypoints.length;
    const t = progress.current - i;
    const a = waypoints[i];
    const b = waypoints[next];
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[2] + (b[2] - a[2]) * t;
    body.current.position.set(x, y, z);

    const dx = b[0] - x;
    const dz = b[2] - z;
    if (dx * dx + dz * dz > 0.0001) {
      body.current.lookAt(b[0], y, b[2]);
    }
  });

  return (
    <group ref={body} position={[-7.5, y, -9.2]}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.85, 6, 12]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color="#e7d3b8" />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow>
        <coneGeometry args={[0.16, 0.22, 5]} />
        <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
