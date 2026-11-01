"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { PlayerAction, PlayerGender } from "@/types/presence";

const ACTION_TINT: Record<PlayerAction, string | null> = {
  idle: null,
  toast: "#f59e0b",
  pour: "#60a5fa",
  snack: "#34d399",
};

function phaseFromName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return (hash % 628) / 100;
}

export function Avatar({
  name,
  gender,
  action,
  isSelf,
  seated,
  position,
  rotationY,
}: {
  name: string;
  gender: PlayerGender;
  action: PlayerAction;
  isSelf: boolean;
  seated: boolean;
  position: [number, number, number];
  rotationY: number;
}) {
  const group = useRef<Group>(null);
  const bobPhase = phaseFromName(name);
  const isFemale = gender === "female";

  const bodyColor =
    ACTION_TINT[action] ??
    (isSelf ? (isFemale ? "#fb7185" : "#38bdf8") : isFemale ? "#f9a8d4" : "#93c5fd");
  const hairColor = isFemale ? "#4c1d95" : "#1e293b";
  const bodyWidth = isFemale ? 0.24 : 0.3;
  const bodyHeight = isFemale ? 0.62 : 0.72;
  const headSize = isFemale ? 0.2 : 0.23;

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    const boost = action === "toast" ? 0.18 : action === "snack" ? 0.1 : seated ? 0.03 : 0.06;
    group.current.position.y = position[1] + Math.sin(t * 4 + bobPhase) * boost;
    if (action === "toast") {
      group.current.rotation.z = Math.sin(t * 10) * 0.12;
    } else if (action === "pour") {
      group.current.rotation.z = -0.25;
    } else {
      group.current.rotation.z = 0;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group ref={group}>
        <mesh position={[0, seated ? 0.85 : 0.95, 0]} castShadow>
          <capsuleGeometry args={[bodyWidth, bodyHeight, 6, 12]} />
          <meshStandardMaterial color={bodyColor} roughness={0.55} metalness={0.05} />
        </mesh>
        <mesh position={[0, seated ? 1.4 : 1.55, 0]} castShadow>
          <sphereGeometry args={[headSize, 16, 16]} />
          <meshStandardMaterial color="#f5e6d3" roughness={0.7} />
        </mesh>

        {/* Hair / style cue */}
        {isFemale ? (
          <>
            <mesh position={[0, seated ? 1.52 : 1.67, 0]} castShadow>
              <sphereGeometry args={[headSize + 0.04, 12, 12]} />
              <meshStandardMaterial color={hairColor} roughness={0.85} />
            </mesh>
            <mesh position={[-0.14, seated ? 1.28 : 1.42, 0.02]} castShadow>
              <sphereGeometry args={[0.08, 10, 10]} />
              <meshStandardMaterial color={hairColor} />
            </mesh>
            <mesh position={[0.14, seated ? 1.28 : 1.42, 0.02]} castShadow>
              <sphereGeometry args={[0.08, 10, 10]} />
              <meshStandardMaterial color={hairColor} />
            </mesh>
          </>
        ) : (
          <mesh position={[0, seated ? 1.52 : 1.67, -0.02]} castShadow>
            <sphereGeometry args={[headSize + 0.02, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
        )}

        {action === "toast" ? (
          <mesh position={[0.42, seated ? 1.05 : 1.2, 0.1]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.05, 0.07, 0.28, 10]} />
            <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={0.4} />
          </mesh>
        ) : null}

        {/* Self marker */}
        <mesh position={[0, seated ? 1.78 : 1.95, 0]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial
            color={isSelf ? "#fbbf24" : isFemale ? "#fb7185" : "#38bdf8"}
            emissive={isSelf ? "#f59e0b" : isFemale ? "#be123c" : "#0284c7"}
            emissiveIntensity={isSelf ? 0.9 : 0.35}
          />
        </mesh>
      </group>
    </group>
  );
}
