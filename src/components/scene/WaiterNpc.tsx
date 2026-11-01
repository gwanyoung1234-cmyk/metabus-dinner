"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { getMenuItem } from "@/lib/menu";
import { HALL_LAYOUT } from "@/lib/seats";
import type { DeliveryState } from "@/types/presence";

const KITCHEN: [number, number, number] = [12.5, 0, 6.5];
const DELIVERY_SECONDS = 3.6;

export function WaiterNpc({ delivery }: { delivery: DeliveryState | null }) {
  const body = useRef<Group>(null);
  const tray = useRef<Group>(null);

  const target = useMemo(() => {
    if (!delivery) return null;
    const table = HALL_LAYOUT.tables.find((entry) => entry.id === delivery.tableId);
    if (!table) return null;
    return [
      table.position[0],
      table.position[1],
      table.position[2],
    ] as [number, number, number];
  }, [delivery]);

  const menuColor = delivery ? getMenuItem(delivery.menuId).color : "#fbbf24";

  useFrame(() => {
    if (!body.current) return;
    if (!delivery || !target) {
      body.current.position.set(KITCHEN[0], KITCHEN[1], KITCHEN[2]);
      body.current.rotation.y = Math.PI;
      if (tray.current) tray.current.visible = false;
      return;
    }

    const elapsed = (Date.now() - delivery.startedAt) / 1000;
    const t = Math.min(1, Math.max(0, elapsed / DELIVERY_SECONDS));
    const ease = t * t * (3 - 2 * t);
    const x = KITCHEN[0] + (target[0] - KITCHEN[0]) * ease;
    const z = KITCHEN[2] + (target[2] - KITCHEN[2]) * ease;
    const y = KITCHEN[1] + (target[1] - KITCHEN[1]) * ease;
    body.current.position.set(x, y, z);
    body.current.lookAt(target[0], y, target[2]);
    if (tray.current) tray.current.visible = t < 0.98;
  });

  return (
    <group ref={body} position={KITCHEN}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.75, 6, 12]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.2, 14, 14]} />
        <meshStandardMaterial color="#f5e6d3" />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.08, 12]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <group ref={tray} position={[0.42, 1.15, 0.1]}>
        <mesh rotation={[0.15, 0, 0.4]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.2} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.2, 0.1, 0.2]} />
          <meshStandardMaterial color={menuColor} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
