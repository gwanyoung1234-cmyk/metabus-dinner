"use client";

import { useMemo } from "react";
import { getMenuItem, type MenuId } from "@/lib/menu";
import type { TableDef } from "@/lib/seats";
import type { OrderState } from "@/types/presence";

function Drumstick({
  position,
  rotation,
  color,
  glaze,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  glaze?: string;
}) {
  return (
    <group position={position} rotation={rotation ?? [0.2, 0.4, 0.1]}>
      {/* Meat */}
      <mesh position={[0, 0.04, 0.02]} castShadow>
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.02, -0.05]} castShadow>
        <capsuleGeometry args={[0.055, 0.08, 4, 8]} />
        <meshStandardMaterial color={glaze ?? color} roughness={0.45} />
      </mesh>
      {/* Bone */}
      <mesh position={[0, -0.01, -0.14]} rotation={[1.1, 0, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.12, 8]} />
        <meshStandardMaterial color="#f5f5f4" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.05, -0.2]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#fafaf9" />
      </mesh>
    </group>
  );
}

function Wing({
  position,
  rotation,
  color,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}) {
  return (
    <group position={position} rotation={rotation ?? [0.3, -0.5, 0.2]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.04, 0.1, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0.06, 0, 0]} rotation={[0, 0, 0.8]} castShadow>
        <capsuleGeometry args={[0.03, 0.07, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}

function ChickenPlate({ menuId, offset }: { menuId: MenuId; offset: number }) {
  const item = getMenuItem(menuId);
  const x = ((offset % 3) - 1) * 0.38;
  const z = Math.floor(offset / 3) * 0.34 - 0.12;
  const green = menuId === "padak";
  const dark = menuId === "ganjang";

  return (
    <group position={[x, 0.06, z]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.03, 20]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <Drumstick
        position={[-0.04, 0.04, 0.02]}
        rotation={[0.35, 0.6, 0.15]}
        color={item.color}
        glaze={dark ? "#451a03" : item.color}
      />
      <Drumstick
        position={[0.05, 0.04, -0.03]}
        rotation={[0.2, -0.9, -0.1]}
        color={dark ? "#92400e" : "#ea580c"}
        glaze={item.color}
      />
      <Wing position={[0.02, 0.05, 0.08]} color={item.color} />
      {green ? (
        <>
          <mesh position={[-0.08, 0.08, -0.06]} rotation={[0.4, 0.2, 0.5]}>
            <boxGeometry args={[0.02, 0.12, 0.02]} />
            <meshStandardMaterial color="#65a30d" />
          </mesh>
          <mesh position={[0.08, 0.09, 0.04]} rotation={[0.2, -0.4, -0.3]}>
            <boxGeometry args={[0.02, 0.1, 0.02]} />
            <meshStandardMaterial color="#84cc16" />
          </mesh>
        </>
      ) : null}
      {menuId === "onion" ? (
        <mesh position={[0, 0.07, -0.08]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#fde68a" roughness={0.7} />
        </mesh>
      ) : null}
    </group>
  );
}

function MeatPlate({ menuId, offset }: { menuId: MenuId; offset: number }) {
  const item = getMenuItem(menuId);
  const x = ((offset % 3) - 1) * 0.36;
  const z = Math.floor(offset / 3) * 0.3 - 0.1;

  return (
    <group position={[x, 0.05, z]}>
      <mesh castShadow>
        <boxGeometry args={[0.32, 0.02, 0.24]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.4} roughness={0.35} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[(i - 1) * 0.07, 0.04, (i % 2) * 0.04 - 0.02]}
          rotation={[0.1, 0.2 * i, 0.05]}
          castShadow
        >
          <boxGeometry args={[0.1, 0.035, 0.07]} />
          <meshStandardMaterial color={item.color} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function DrinkMesh({ menuId, offset }: { menuId: MenuId; offset: number }) {
  const item = getMenuItem(menuId);
  const x = ((offset % 3) - 1) * 0.35;
  const z = Math.floor(offset / 3) * 0.32 - 0.15;

  if (menuId === "soju") {
    return (
      <mesh position={[x, 0.16, z]} castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.28, 10]} />
        <meshStandardMaterial color={item.color} transparent opacity={0.85} />
      </mesh>
    );
  }

  return (
    <group position={[x, 0.02, z]}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.05, 0.22, 12]} />
        <meshStandardMaterial color="#fef3c7" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.14, 12]} />
        <meshStandardMaterial color={item.color} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.03, 12]} />
        <meshStandardMaterial color="#f8fafc" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function DishMesh({ menuId, offset }: { menuId: MenuId; offset: number }) {
  const item = getMenuItem(menuId);
  if (item.kind === "drink") return <DrinkMesh menuId={menuId} offset={offset} />;
  if (item.kind === "meat") return <MeatPlate menuId={menuId} offset={offset} />;
  return <ChickenPlate menuId={menuId} offset={offset} />;
}

export function ServedDishes({
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
      const list = map.get(order.tableId) ?? [];
      list.push(order);
      map.set(order.tableId, list);
    }
    return map;
  }, [orders]);

  return (
    <group>
      {tables.map((table) => {
        const dishes = byTable.get(table.id);
        if (!dishes?.length) return null;
        return (
          <group
            key={table.id}
            position={[table.position[0], table.position[1] + 0.82, table.position[2]]}
          >
            {dishes.slice(0, 6).map((order, index) => (
              <DishMesh key={order.id} menuId={order.menuId} offset={index} />
            ))}
          </group>
        );
      })}
    </group>
  );
}
