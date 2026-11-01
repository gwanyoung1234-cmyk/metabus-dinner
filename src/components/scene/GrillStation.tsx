"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import { getMenuItem } from "@/lib/menu";
import type { OrderState } from "@/types/presence";
import type { TableDef } from "@/lib/seats";

const DONENESS = ["#fca5a5", "#f87171", "#b91c1c", "#7f1d1d"] as const;
const LABEL = ["생고기", "뒤집는 중", "알맞게", "잘 익음"] as const;

function MeatOnGrill({
  order,
  index,
}: {
  order: OrderState;
  index: number;
}) {
  const meat = useRef<Group>(null);
  const smoke = useRef<Mesh>(null);
  const level = order.grillLevel ?? 0;
  const item = getMenuItem(order.menuId);
  const color = DONENESS[Math.min(3, level)] ?? item.color;
  const x = ((index % 2) - 0.5) * 0.28;
  const z = (Math.floor(index / 2) - 0.5) * 0.22;

  useFrame(({ clock }) => {
    if (!meat.current) return;
    const t = clock.elapsedTime;
    if (level < 3) {
      meat.current.position.y = 0.02 + Math.sin(t * 8 + index) * 0.008;
      if (level === 1) {
        meat.current.rotation.z = Math.sin(t * 10) * 0.4;
      } else {
        meat.current.rotation.z = 0;
      }
    } else {
      meat.current.position.y = 0.02;
      meat.current.rotation.z = 0;
    }
    if (smoke.current) {
      const cooking = level > 0 && level < 3;
      smoke.current.visible = cooking;
      if (cooking) {
        smoke.current.position.y = 0.12 + (t % 1) * 0.25;
        const mat = smoke.current.material as { opacity: number };
        mat.opacity = 0.35 * (1 - (t % 1));
      }
    }
  });

  return (
    <group position={[x, 0.86, z]}>
      <group ref={meat}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.035, 0.11]} />
          <meshStandardMaterial
            color={color}
            roughness={0.55}
            emissive={level > 0 && level < 3 ? "#ea580c" : "#000000"}
            emissiveIntensity={level > 0 && level < 3 ? 0.25 : 0}
          />
        </mesh>
        <mesh position={[0.02, 0.02, 0.01]}>
          <boxGeometry args={[0.12, 0.02, 0.08]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </group>
      <mesh ref={smoke} position={[0, 0.15, 0]} visible={false}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#d1d5db" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export function GrillStation({
  orders,
  tables,
}: {
  orders: OrderState[];
  tables: TableDef[];
}) {
  const byTable = useMemo(() => {
    const map = new Map<string, OrderState[]>();
    for (const order of orders) {
      if (order.status !== "served") continue;
      const kind = getMenuItem(order.menuId).kind;
      if (kind !== "meat") continue;
      const list = map.get(order.tableId) ?? [];
      list.push(order);
      map.set(order.tableId, list);
    }
    return map;
  }, [orders]);

  return (
    <group>
      {tables.map((table) => {
        const meats = byTable.get(table.id);
        if (!meats?.length) return null;
        const top = meats[meats.length - 1];
        const level = top?.grillLevel ?? 0;
        return (
          <group
            key={table.id}
            position={[table.position[0], table.position[1], table.position[2]]}
          >
            {/* Hot grill glow */}
            <mesh position={[0, 0.84, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.26, 20]} />
              <meshStandardMaterial
                color="#111827"
                emissive="#ea580c"
                emissiveIntensity={0.35 + level * 0.15}
              />
            </mesh>
            {meats.slice(0, 4).map((order, index) => (
              <MeatOnGrill key={order.id} order={order} index={index} />
            ))}
            {/* Tiny status beacon */}
            <mesh position={[0.55, 1.05, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial
                color={DONENESS[level]}
                emissive={DONENESS[level]}
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export const GRILL_LABELS = LABEL;
