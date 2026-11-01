"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { DoubleSide } from "three";
import { BOOR_CAM_BOUNDS, BOOR_MOVE_BOUNDS } from "@/lib/cameraBounds";
import { HALL_LAYOUT, RAISED_PLATFORM_Y } from "@/lib/seats";
import type { DeliveryState, OrderState, PlayerState } from "@/types/presence";
import { Avatar } from "./Avatar";
import { HallFurniture } from "./HallFurniture";
import { LocalPlayer } from "./LocalPlayer";
import { ServedDishes } from "./ServedDishes";
import { WaiterNpc } from "./WaiterNpc";

function floorY(z: number) {
  return z < -3.7 ? RAISED_PLATFORM_Y : 0;
}

function BrickPillar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 3.4, 1.15]} />
        <meshStandardMaterial color="#8f3d2f" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.55, 0.6]}>
        <boxGeometry args={[1.0, 1.65, 0.1]} />
        <meshStandardMaterial color="#6b2a20" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.55, 0.68]}>
        <boxGeometry args={[0.8, 1.3, 0.04]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.7, 0.72]}>
        <boxGeometry args={[0.5, 0.7, 0.02]} />
        <meshStandardMaterial color="#7c2d12" />
      </mesh>
    </group>
  );
}

function HallEnvironment() {
  return (
    <>
      <color attach="background" args={["#2a2018"]} />
      <ambientLight intensity={0.7} color="#ffd8b0" />
      <directionalLight
        castShadow
        position={[8, 16, 6]}
        intensity={1.1}
        color="#ffe0c0"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
      <pointLight position={[0, 4, 2]} intensity={1.4} distance={24} color="#ffb065" />
      <pointLight position={[-6, 3.5, -6]} intensity={1.1} distance={16} color="#ffb065" />
      <pointLight position={[6, 3.5, -6]} intensity={1.1} distance={16} color="#ffb065" />

      {/* Grey tile floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} receiveShadow>
        <planeGeometry args={[42, 28]} />
        <meshStandardMaterial color="#7b8494" roughness={0.95} />
      </mesh>

      {/* Raised rear platform */}
      <mesh position={[0, RAISED_PLATFORM_Y / 2, -8.4]} receiveShadow castShadow>
        <boxGeometry args={[28, RAISED_PLATFORM_Y, 9.2]} />
        <meshStandardMaterial color="#9aa3af" roughness={0.92} />
      </mesh>
      <mesh position={[0, RAISED_PLATFORM_Y / 2, -3.75]} castShadow>
        <boxGeometry args={[28, RAISED_PLATFORM_Y, 0.18]} />
        <meshStandardMaterial color="#6b7280" roughness={0.9} />
      </mesh>

      {/* Walls */}
      <mesh position={[-15.5, 2.2, -1]} receiveShadow>
        <boxGeometry args={[0.35, 4.6, 30]} />
        <meshStandardMaterial color="#7a4a28" roughness={0.85} />
      </mesh>
      <mesh position={[15.5, 2.2, -1]} receiveShadow>
        <boxGeometry args={[0.35, 4.6, 30]} />
        <meshStandardMaterial color="#6f4330" roughness={0.85} />
      </mesh>
      <mesh position={[0, 2.3, -13.1]} receiveShadow>
        <boxGeometry args={[32, 4.8, 0.4]} />
        <meshStandardMaterial color="#c4a882" roughness={0.9} />
      </mesh>

      {/* High ceiling — keep camera under it */}
      <mesh position={[0, 7.2, -1]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[34, 30]} />
        <meshStandardMaterial color="#2a3038" roughness={1} side={DoubleSide} />
      </mesh>

      {/* Edison bulb meshes (visual only — lighting above) */}
      {(
        [
          [-6, 3.15, 3],
          [0, 3.15, 3],
          [6, 3.15, 3],
          [-4, 3.35, -6],
          [4, 3.35, -6],
        ] as const
      ).map((spot) => (
        <group key={spot.join(",")} position={spot}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.8, 6]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2.4} />
          </mesh>
        </group>
      ))}

      <BrickPillar position={[-4.2, 0, -3.6]} />
      <BrickPillar position={[4.2, 0, -3.6]} />
      <BrickPillar position={[-4.2, 0, 2.8]} />
      <BrickPillar position={[4.2, 0, 2.8]} />

      {/* Purple BOOR neon */}
      <mesh position={[-4.2, 2.85, -2.95]}>
        <boxGeometry args={[1.15, 0.4, 0.08]} />
        <meshStandardMaterial color="#c026d3" emissive="#d946ef" emissiveIntensity={2.4} />
      </mesh>
      <pointLight position={[-4.2, 2.85, -2.5]} intensity={1.3} distance={7} color="#e879f9" />
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
  const seatMap = useMemo(() => {
    return new Map(HALL_LAYOUT.seats.map((seat) => [seat.id, seat]));
  }, []);

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

        const x = player.x ?? 0;
        const z = player.z ?? 7;
        return (
          <Avatar
            key={player.id}
            name={player.name}
            gender={player.gender ?? "male"}
            action={player.lastAction}
            isSelf={false}
            seated={false}
            position={[x, floorY(z), z]}
            rotationY={player.rotationY ?? Math.PI}
            onHit={hit}
            speech={speech}
          />
        );
      })}
    </>
  );
}

export function DinnerHall({
  players,
  selfId,
  orders,
  delivery,
  onSeatClick,
  onHitPlayer,
  speechById,
}: {
  players: PlayerState[];
  selfId: string | null;
  orders: OrderState[];
  delivery: DeliveryState | null;
  onSeatClick: (seatId: string) => void;
  onHitPlayer?: (targetId: string) => void;
  speechById?: Record<string, string>;
}) {
  const me = useMemo(
    () => players.find((player) => player.id === selfId) ?? null,
    [players, selfId],
  );
  const mySeat = useMemo(() => {
    if (!me?.seatId) return null;
    return HALL_LAYOUT.seats.find((seat) => seat.id === me.seatId) ?? null;
  }, [me]);

  const occupiedSeats = useMemo(() => {
    return new Set(
      players.filter((player) => player.seatId).map((player) => player.seatId as string),
    );
  }, [players]);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 5.2, 13], fov: 58, near: 0.1, far: 80 }}
      className="h-full w-full"
      onPointerMissed={() => {
        // keep focus for keyboard after clicking empty space
        (document.activeElement as HTMLElement | null)?.blur?.();
      }}
    >
      <Suspense fallback={null}>
        <HallEnvironment />
        <HallFurniture occupiedSeats={occupiedSeats} onSeatClick={onSeatClick} />
        <ServedDishes orders={orders} tables={HALL_LAYOUT.tables} />
        <RemotePlayers
          players={players}
          selfId={selfId}
          onHitPlayer={onHitPlayer}
          speechById={speechById}
        />
        {me ? (
          <LocalPlayer
            name={me.name}
            gender={me.gender ?? "male"}
            action={me.lastAction}
            seated={Boolean(me.seatId)}
            seatPosition={mySeat ? mySeat.position : null}
            seatRotationY={mySeat?.rotationY ?? 0}
            x={me.x ?? 0}
            z={me.z ?? 7.2}
            rotationY={me.rotationY ?? Math.PI}
            camBounds={BOOR_CAM_BOUNDS}
            moveBounds={BOOR_MOVE_BOUNDS}
            speech={speechById?.[me.id] ?? null}
          />
        ) : null}
        <WaiterNpc
          delivery={delivery}
          name="알바생"
          kitchen={[10.5, 0, 6.5]}
          tables={HALL_LAYOUT.tables}
        />
      </Suspense>
    </Canvas>
  );
}
