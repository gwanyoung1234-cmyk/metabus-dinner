"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Group } from "three";
import { HANPANDER_LAYOUT, LOBSTER_NPC } from "@/lib/hanpanderSeats";
import { Avatar } from "./Avatar";

export function LobsterNpc({ onHit }: { onHit?: () => void }) {
  const seat = HANPANDER_LAYOUT.seats.find((entry) => entry.id === LOBSTER_NPC.seatId);
  const [hurtUntil, setHurtUntil] = useState(0);
  const flash = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!flash.current) return;
    const hurting = performance.now() < hurtUntil;
    flash.current.rotation.z = hurting ? Math.sin(clock.elapsedTime * 30) * 0.2 : 0;
  });

  if (!seat) return null;

  const hurting = performance.now() < hurtUntil;

  return (
    <group ref={flash}>
      <Avatar
        name={LOBSTER_NPC.name}
        gender="male"
        action={hurting ? "hurt" : "idle"}
        isSelf={false}
        seated
        position={[seat.position[0], seat.position[1] + 0.42, seat.position[2]]}
        rotationY={seat.rotationY}
        onHit={() => {
          const until = performance.now() + 900;
          setHurtUntil(until);
          window.setTimeout(() => {
            setHurtUntil((current) => (current === until ? 0 : current));
          }, 920);
          onHit?.();
        }}
      />
      {/* Lobster badge */}
      <mesh
        position={[seat.position[0], seat.position[1] + 2.15, seat.position[2]]}
      >
        <boxGeometry args={[0.55, 0.16, 0.04]} />
        <meshStandardMaterial color="#dc2626" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
