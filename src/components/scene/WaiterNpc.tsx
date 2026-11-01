"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { getMenuItem } from "@/lib/menu";
import { HALL_LAYOUT, type TableDef } from "@/lib/seats";
import type { DeliveryState } from "@/types/presence";
import { NamePlate } from "./NamePlate";

const DEFAULT_KITCHEN: [number, number, number] = [10.5, 0, 6.5];
const DELIVERY_SECONDS = 4.2;

export function WaiterNpc({
  delivery,
  kitchen = DEFAULT_KITCHEN,
  tables = HALL_LAYOUT.tables,
  name = "알바생",
}: {
  delivery: DeliveryState | null;
  kitchen?: [number, number, number];
  tables?: TableDef[];
  name?: string;
}) {
  const body = useRef<Group>(null);
  const hips = useRef<Group>(null);
  const tray = useRef<Group>(null);
  const localStart = useRef<number | null>(null);
  const lastOrderId = useRef<string | null>(null);
  const idlePhase = useRef(0);

  const target = useMemo(() => {
    if (!delivery) return null;
    const table = tables.find((entry) => entry.id === delivery.tableId);
    if (!table) return null;
    return [table.position[0], table.position[1], table.position[2]] as [
      number,
      number,
      number,
    ];
  }, [delivery, tables]);

  useEffect(() => {
    if (!delivery) {
      lastOrderId.current = null;
      localStart.current = null;
      return;
    }
    if (delivery.orderId !== lastOrderId.current) {
      lastOrderId.current = delivery.orderId;
      localStart.current = performance.now();
    }
  }, [delivery]);

  const menuColor = delivery ? getMenuItem(delivery.menuId).color : "#fbbf24";
  const bubble = delivery
    ? `${getMenuItem(delivery.menuId).name} 나릅니다!`
    : null;

  useFrame((_state, delta) => {
    if (!body.current) return;

    if (!delivery || !target || localStart.current == null) {
      // Pace near kitchen so they are not frozen.
      idlePhase.current += delta * 0.7;
      const ox = Math.sin(idlePhase.current) * 0.8;
      const oz = Math.cos(idlePhase.current * 0.6) * 0.5;
      body.current.position.set(kitchen[0] + ox, kitchen[1], kitchen[2] + oz);
      body.current.rotation.y = idlePhase.current;
      if (hips.current) {
        hips.current.position.y = Math.abs(Math.sin(idlePhase.current * 4)) * 0.04;
      }
      if (tray.current) tray.current.visible = false;
      return;
    }

    const elapsed = (performance.now() - localStart.current) / 1000;
    const t = Math.min(1, Math.max(0, elapsed / DELIVERY_SECONDS));
    const ease = t * t * (3 - 2 * t);
    // Out to table then back a little at the end feel.
    const x = kitchen[0] + (target[0] - kitchen[0]) * ease;
    const z = kitchen[2] + (target[2] - kitchen[2]) * ease;
    const y = kitchen[1] + (target[1] - kitchen[1]) * ease;
    body.current.position.set(x, y, z);

    const faceX = target[0] - x;
    const faceZ = target[2] - z;
    if (faceX * faceX + faceZ * faceZ > 0.0001) {
      body.current.rotation.y = Math.atan2(faceX, faceZ);
    }
    if (hips.current) {
      hips.current.position.y = Math.abs(Math.sin(elapsed * 10)) * 0.06;
    }
    if (tray.current) tray.current.visible = t < 0.98;
  });

  return (
    <group ref={body} position={kitchen}>
      <group ref={hips}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <capsuleGeometry args={[0.22, 0.55, 6, 12]} />
          <meshStandardMaterial color="#1e3a5f" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <sphereGeometry args={[0.18, 14, 14]} />
          <meshStandardMaterial color="#f5e6d3" />
        </mesh>
        <mesh position={[0, 1.78, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.08, 12]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        {/* Legs suggestion */}
        <mesh position={[-0.1, 0.35, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.1, 0.35, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <NamePlate name={name} bubble={bubble} accent="#38bdf8" height={2.2} />
        <group ref={tray} position={[0.4, 1.1, 0.12]} visible={false}>
          <mesh rotation={[0.2, 0, 0.35]}>
            <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
            <meshStandardMaterial color="#e5e7eb" metalness={0.25} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.16, 0.08, 0.16]} />
            <meshStandardMaterial color={menuColor} roughness={0.65} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
