"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { DoubleSide } from "three";
import {
  HANPANDER_CAM_BOUNDS,
  HANPANDER_LAYOUT,
  HANPANDER_MOVE_BOUNDS,
  LOBSTER_SEAT_ID,
} from "@/lib/hanpanderSeats";
import type { DeliveryState, OrderState, PlayerState } from "@/types/presence";
import { Avatar } from "./Avatar";
import { GrillStation } from "./GrillStation";
import { LocalPlayer } from "./LocalPlayer";
import { LobsterNpc } from "./LobsterNpc";
import { ServedDishes } from "./ServedDishes";
import { WaiterNpc } from "./WaiterNpc";

function BbqTable({
  position,
  seatIds,
  occupiedSeats,
  onSeatClick,
}: {
  position: [number, number, number];
  seatIds: { bench: string; chair: string };
  occupiedSeats: Set<string>;
  onSeatClick: (seatId: string) => void;
}) {
  return (
    <group position={position}>
      {/* Stainless table */}
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.08, 2.4]} />
        <meshStandardMaterial color="#c5c8ce" metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.55, 0.7, 2.2]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* Grill ring */}
      <mesh position={[0, 0.84, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.38, 24]} />
        <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.83, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 24]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>

      {/* Exhaust hood */}
      <mesh position={[0, 2.55, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 1.6, 10]} />
        <meshStandardMaterial color="#111827" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.18, 16]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Wall bench */}
      <group
        position={[-1.15, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={(event) => {
          event.stopPropagation();
          if (seatIds.bench === LOBSTER_SEAT_ID) return;
          if (occupiedSeats.has(seatIds.bench)) return;
          onSeatClick(seatIds.bench);
        }}
      >
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[2.2, 0.14, 0.55]} />
          <meshStandardMaterial
            color="#111827"
            emissive={occupiedSeats.has(seatIds.bench) || seatIds.bench === LOBSTER_SEAT_ID ? "#000" : "#f59e0b"}
            emissiveIntensity={
              occupiedSeats.has(seatIds.bench) || seatIds.bench === LOBSTER_SEAT_ID ? 0 : 0.12
            }
          />
        </mesh>
        <mesh position={[0, 0.85, -0.18]} castShadow>
          <boxGeometry args={[2.2, 0.7, 0.12]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* Opposite chair */}
      <group
        position={[1.15, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        onClick={(event) => {
          event.stopPropagation();
          if (occupiedSeats.has(seatIds.chair)) return;
          onSeatClick(seatIds.chair);
        }}
      >
        <mesh position={[0, 0.48, 0]} castShadow>
          <boxGeometry args={[0.5, 0.08, 0.5]} />
          <meshStandardMaterial
            color="#111827"
            emissive={occupiedSeats.has(seatIds.chair) ? "#000" : "#f59e0b"}
            emissiveIntensity={occupiedSeats.has(seatIds.chair) ? 0 : 0.15}
          />
        </mesh>
        <mesh position={[0, 0.9, -0.2]} castShadow>
          <boxGeometry args={[0.5, 0.75, 0.08]} />
          <meshStandardMaterial color="#171717" />
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
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function HanpanderEnvironment() {
  return (
    <>
      <color attach="background" args={["#1c2420"]} />
      <ambientLight intensity={0.55} color="#d1fae5" />
      <directionalLight
        castShadow
        position={[8, 14, 4]}
        intensity={1.05}
        color="#fff7ed"
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[4, 3.2, 0]} intensity={1.2} distance={22} color="#fdba74" />
      <pointLight position={[1, 2.8, -6]} intensity={0.8} distance={14} color="#6ee7b7" />

      {/* Wide grey tile floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5.5, 0, 0]} receiveShadow>
        <planeGeometry args={[36, 32]} />
        <meshStandardMaterial color="#6b7280" roughness={0.95} />
      </mesh>

      {/* Green booth wall */}
      <mesh position={[-2.2, 2.1, 0]} receiveShadow>
        <boxGeometry args={[0.3, 4.4, 28]} />
        <meshStandardMaterial color="#3f6b52" roughness={0.85} />
      </mesh>
      {[-9, -4.5, 0, 4.5, 9].map((z) => (
        <mesh key={z} position={[-2.02, 1.6, z]}>
          <boxGeometry args={[0.06, 2.4, 3.2]} />
          <meshStandardMaterial color="#2f5641" roughness={0.8} />
        </mesh>
      ))}

      {/* Far aisle wall */}
      <mesh position={[13.8, 2.1, 0]}>
        <boxGeometry args={[0.35, 4.4, 28]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>

      {/* Front / back walls */}
      <mesh position={[5.5, 2.1, -13.6]}>
        <boxGeometry args={[32, 4.4, 0.3]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>
      <mesh position={[5.5, 2.1, 13.6]}>
        <boxGeometry args={[32, 4.4, 0.3]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>

      {/* Street window */}
      <mesh position={[5.5, 1.9, -13.4]}>
        <planeGeometry args={[10, 2.8]} />
        <meshStandardMaterial
          color="#93c5fd"
          emissive="#60a5fa"
          emissiveIntensity={0.35}
          side={DoubleSide}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[5.5, 4.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[32, 30]} />
        <meshStandardMaterial color="#1f2937" side={DoubleSide} />
      </mesh>

      {/* Posters */}
      <mesh position={[-2.02, 2.4, 5]}>
        <boxGeometry args={[0.04, 1.1, 0.85]} />
        <meshStandardMaterial color="#d6b48a" />
      </mesh>
      <mesh position={[-2.02, 2.1, 6.2]}>
        <boxGeometry args={[0.04, 0.7, 0.55]} />
        <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.25} />
      </mesh>

      {/* Entrance fridge counter */}
      <mesh position={[11.5, 1.0, 10.5]} castShadow>
        <boxGeometry args={[2.4, 1.8, 1.2]} />
        <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.55} />
      </mesh>
    </>
  );
}

function RemotePlayers({
  players,
  selfId,
  onHitPlayer,
  speechById,
}: {
  players: PlayerState[];
  selfId: string | null;
  onHitPlayer?: (targetId: string) => void;
  speechById?: Record<string, string>;
}) {
  const seatMap = useMemo(
    () => new Map(HANPANDER_LAYOUT.seats.map((seat) => [seat.id, seat])),
    [],
  );

  return (
    <>
      {players.map((player) => {
        if (player.id === selfId) return null;
        const hit = onHitPlayer ? () => onHitPlayer(player.id) : undefined;
        const speech = speechById?.[player.id] ?? null;
        if (player.seatId) {
          const seat = seatMap.get(player.seatId);
          if (!seat) return null;
          return (
            <Avatar
              key={player.id}
              name={player.name}
              gender={player.gender ?? "male"}
              action={player.lastAction}
              isSelf={false}
              seated
              position={[seat.position[0], seat.position[1] + 0.42, seat.position[2]]}
              rotationY={seat.rotationY}
              onHit={hit}
              speech={speech}
            />
          );
        }
        return (
          <Avatar
            key={player.id}
            name={player.name}
            gender={player.gender ?? "male"}
            action={player.lastAction}
            isSelf={false}
            seated={false}
            position={[player.x ?? 0, 0, player.z ?? 6]}
            rotationY={player.rotationY ?? Math.PI}
            onHit={hit}
            speech={speech}
          />
        );
      })}
    </>
  );
}

export function HanpanderHall({
  players,
  selfId,
  orders,
  delivery,
  onSeatClick,
  onHitPlayer,
  onHitLobster,
  speechById,
}: {
  players: PlayerState[];
  selfId: string | null;
  orders: OrderState[];
  delivery: DeliveryState | null;
  onSeatClick: (seatId: string) => void;
  onHitPlayer?: (targetId: string) => void;
  onHitLobster?: () => void;
  speechById?: Record<string, string>;
}) {
  const me = useMemo(
    () => players.find((player) => player.id === selfId) ?? null,
    [players, selfId],
  );
  const mySeat = useMemo(() => {
    if (!me?.seatId) return null;
    return HANPANDER_LAYOUT.seats.find((seat) => seat.id === me.seatId) ?? null;
  }, [me]);

  const occupiedSeats = useMemo(() => {
    const set = new Set(
      players.filter((player) => player.seatId).map((player) => player.seatId as string),
    );
    set.add(LOBSTER_SEAT_ID);
    return set;
  }, [players]);

  return (
    <Canvas
      shadows
      camera={{ position: [8, 4.6, 12], fov: 58, near: 0.1, far: 80 }}
      className="h-full w-full"
    >
      <Suspense fallback={null}>
        <HanpanderEnvironment />
        {HANPANDER_LAYOUT.tables.map((table, index) => (
          <BbqTable
            key={table.id}
            position={table.position}
            seatIds={{
              bench: `hp-t-${index}-bench`,
              chair: `hp-t-${index}-chair`,
            }}
            occupiedSeats={occupiedSeats}
            onSeatClick={onSeatClick}
          />
        ))}
        <ServedDishes orders={orders} tables={HANPANDER_LAYOUT.tables} />
        <GrillStation orders={orders} tables={HANPANDER_LAYOUT.tables} />
        <RemotePlayers
          players={players}
          selfId={selfId}
          onHitPlayer={onHitPlayer}
          speechById={speechById}
        />
        <LobsterNpc onHit={onHitLobster} />
        {me ? (
          <LocalPlayer
            name={me.name}
            gender={me.gender ?? "male"}
            action={me.lastAction}
            seated={Boolean(me.seatId)}
            seatPosition={mySeat ? mySeat.position : null}
            seatRotationY={mySeat?.rotationY ?? 0}
            x={me.x ?? 7}
            z={me.z ?? 9}
            rotationY={me.rotationY ?? Math.PI}
            camBounds={HANPANDER_CAM_BOUNDS}
            moveBounds={HANPANDER_MOVE_BOUNDS}
            speech={me ? speechById?.[me.id] ?? null : null}
          />
        ) : null}
        <WaiterNpc
          delivery={delivery}
          kitchen={[11.5, 0, 10]}
          tables={HANPANDER_LAYOUT.tables}
          name="알바생"
        />
      </Suspense>
    </Canvas>
  );
}
