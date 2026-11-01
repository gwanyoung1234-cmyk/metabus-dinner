"use client";

import { HALL_LAYOUT } from "@/lib/seats";
import type { ThreeEvent } from "@react-three/fiber";

function ChickenTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.35, 0.08, 1.35]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[2.28, 0.06, 1.28]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.35} />
      </mesh>
      {(
        [
          [-1.0, 0.35, -0.5],
          [1.0, 0.35, -0.5],
          [-1.0, 0.35, 0.5],
          [1.0, 0.35, 0.5],
        ] as const
      ).map((leg, index) => (
        <mesh key={index} position={leg} castShadow>
          <boxGeometry args={[0.07, 0.7, 0.07]} />
          <meshStandardMaterial color="#1c1c1c" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[-0.55, 0.9, 0.15]} castShadow>
        <boxGeometry args={[0.28, 0.16, 0.18]} />
        <meshStandardMaterial color="#6d4c2f" roughness={0.65} />
      </mesh>
      <mesh position={[0.45, 0.84, -0.2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

function DiningChair({
  seatId,
  position,
  rotationY,
  occupied,
  onSeatClick,
}: {
  seatId: string;
  position: [number, number, number];
  rotationY: number;
  occupied: boolean;
  onSeatClick?: (seatId: string) => void;
}) {
  const cushion = occupied ? "#4b5563" : "#374151";

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    if (occupied || !onSeatClick) return;
    onSeatClick(seatId);
  }

  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={handleClick}>
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.48, 0.07, 0.48]} />
        <meshStandardMaterial
          color={occupied ? cushion : "#4b5563"}
          emissive={occupied ? "#000000" : "#f59e0b"}
          emissiveIntensity={occupied ? 0 : 0.15}
          roughness={0.85}
        />
      </mesh>
      <mesh position={[0, 0.85, -0.2]} castShadow>
        <boxGeometry args={[0.48, 0.7, 0.07]} />
        <meshStandardMaterial color={cushion} roughness={0.85} />
      </mesh>
      {(
        [
          [-0.18, 0.24, 0.16],
          [0.18, 0.24, 0.16],
          [-0.18, 0.24, -0.16],
          [0.18, 0.24, -0.16],
        ] as const
      ).map((leg, index) => (
        <mesh key={index} position={leg} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.48, 8]} />
          <meshStandardMaterial color="#111827" metalness={0.65} roughness={0.35} />
        </mesh>
      ))}
      {/* Click helper volume */}
      <mesh position={[0, 0.7, 0]} visible={false}>
        <boxGeometry args={[0.7, 1.2, 0.7]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function BeerCrateStack({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <group position={position}>
      {[0, 0.28, 0.56].map((y, index) => (
        <mesh key={index} position={[0, y + 0.12, 0]} castShadow>
          <boxGeometry args={[0.55, 0.24, 0.4]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Bench({ position, width = 4 }: { position: [number, number, number]; width?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.12, 0.55]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.75, -0.2]} castShadow>
        <boxGeometry args={[width, 0.55, 0.1]} />
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function HallFurniture({
  occupiedSeats,
  onSeatClick,
}: {
  occupiedSeats: Set<string>;
  onSeatClick?: (seatId: string) => void;
}) {
  return (
    <group>
      {HALL_LAYOUT.tables.map((table) => (
        <ChickenTable key={table.id} position={table.position} />
      ))}
      {HALL_LAYOUT.seats.map((seat) => (
        <DiningChair
          key={seat.id}
          seatId={seat.id}
          position={seat.position}
          rotationY={seat.rotationY}
          occupied={occupiedSeats.has(seat.id)}
          onSeatClick={onSeatClick}
        />
      ))}

      <Bench position={[-6.5, 0.42, -10.8]} width={5.5} />
      <Bench position={[6.5, 0.42, -10.8]} width={5.5} />

      <BeerCrateStack position={[-1.2, 0.02, -3.2]} color="#1d4ed8" />
      <BeerCrateStack position={[-0.5, 0.02, -3.35]} color="#15803d" />
      <BeerCrateStack position={[0.9, 0.02, -3.15]} color="#1d4ed8" />
      <BeerCrateStack position={[1.55, 0.02, -3.4]} color="#166534" />

      <mesh position={[0.2, 0.55, -2.7]} castShadow>
        <boxGeometry args={[4.2, 0.06, 0.06]} />
        <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.3} />
      </mesh>
      {[-1.6, -0.4, 0.8, 1.8].map((x) => (
        <mesh key={x} position={[x, 0.28, -2.7]} castShadow>
          <boxGeometry args={[0.05, 0.55, 0.05]} />
          <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
