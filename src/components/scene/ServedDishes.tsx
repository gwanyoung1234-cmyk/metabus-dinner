"use client";

import { useMemo } from "react";
import { getMenuItem } from "@/lib/menu";
import { HALL_LAYOUT } from "@/lib/seats";
import type { OrderState } from "@/types/presence";

function DishMesh({ menuId, offset }: { menuId: OrderState["menuId"]; offset: number }) {
  const item = getMenuItem(menuId);
  const x = ((offset % 3) - 1) * 0.35;
  const z = Math.floor(offset / 3) * 0.32 - 0.15;

  if (menuId === "beer") {
    return (
      <mesh position={[x, 0.14, z]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.28, 10]} />
        <meshStandardMaterial color={item.color} transparent opacity={0.9} />
      </mesh>
    );
  }

  return (
    <group position={[x, 0.08, z]}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.08, 0.28]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.2]} />
        <meshStandardMaterial color={item.color} roughness={0.65} />
      </mesh>
    </group>
  );
}

export function ServedDishes({ orders }: { orders: OrderState[] }) {
  const byTable = useMemo(() => {
    const map = new Map<string, OrderState[]>();
    for (const order of orders) {
      if (order.status !== "served") continue;
      const list = map.get(order.tableId) ?? [];
      list.push(order);
      map.set(order.tableId, list);
    }
    return map;
  }, [orders]);

  return (
    <group>
      {HALL_LAYOUT.tables.map((table) => {
        const dishes = byTable.get(table.id);
        if (!dishes?.length) return null;
        return (
          <group key={table.id} position={[table.position[0], table.position[1] + 0.82, table.position[2]]}>
            {dishes.slice(0, 6).map((order, index) => (
              <DishMesh key={order.id} menuId={order.menuId} offset={index} />
            ))}
          </group>
        );
      })}
    </group>
  );
}
