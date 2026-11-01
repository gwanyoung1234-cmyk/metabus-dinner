"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import type { Group, Mesh } from "three";
import type { PlayerAction, PlayerGender } from "@/types/presence";
import { NamePlate } from "./NamePlate";

function BeerGlass({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation ?? [0, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.22, 12]} />
        <meshStandardMaterial color="#fef3c7" transparent opacity={0.45} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.04, 0.048, 0.14, 12]} />
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.85} emissive="#f59e0b" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
        <meshStandardMaterial color="#fff7ed" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

const ACTION_TINT: Record<PlayerAction, string | null> = {
  idle: null,
  toast: "#f59e0b",
  pour: "#60a5fa",
  snack: "#34d399",
  grill: "#ea580c",
  punch: "#f97316",
  hurt: "#ef4444",
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
  moving = false,
  movingRef,
  onHit,
  speech,
}: {
  name: string;
  gender: PlayerGender;
  action: PlayerAction;
  isSelf: boolean;
  seated: boolean;
  position: [number, number, number];
  rotationY: number;
  moving?: boolean;
  movingRef?: RefObject<boolean>;
  onHit?: () => void;
  speech?: string | null;
}) {
  const root = useRef<Group>(null);
  const hips = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftFore = useRef<Mesh>(null);
  const rightFore = useRef<Mesh>(null);
  const glass = useRef<Group>(null);
  const head = useRef<Group>(null);
  const prevXZ = useRef({ x: position[0], z: position[2] });
  const moveUntil = useRef(0);
  const bobPhase = phaseFromName(name);
  const isFemale = gender === "female";

  const shirtColor =
    ACTION_TINT[action] ??
    (isSelf ? (isFemale ? "#fb7185" : "#38bdf8") : isFemale ? "#f9a8d4" : "#60a5fa");
  const pantsColor = isFemale ? "#7c3aed" : "#1e3a5f";
  const hairColor = isFemale ? "#4c1d95" : "#1e293b";
  const skinColor = "#f0d5b8";
  const shoeColor = "#1f2937";

  const scale = isFemale ? 0.92 : 1;

  useFrame(({ clock }) => {
    if (!hips.current) return;
    const t = clock.elapsedTime;

    const dx = position[0] - prevXZ.current.x;
    const dz = position[2] - prevXZ.current.z;
    const moved = Math.hypot(dx, dz) > 0.002;
    prevXZ.current = { x: position[0], z: position[2] };
    if (moved || moving || movingRef?.current) {
      moveUntil.current = performance.now() + 160;
    }

    const isMoving = !seated && (movingRef?.current || moving || performance.now() < moveUntil.current);
    const walk = isMoving ? Math.sin(t * 9 + bobPhase) : 0;
    const walkAbs = isMoving ? Math.abs(Math.sin(t * 9 + bobPhase)) : 0;

    hips.current.position.y = seated
      ? 0.52
      : 0.78 + (isMoving ? walkAbs * 0.045 : Math.sin(t * 3.2 + bobPhase) * 0.015);
    if (action === "hurt") {
      // Hit on the back of the head — pitch forward hard.
      hips.current.rotation.z = Math.sin(t * 20) * 0.08;
      hips.current.rotation.x = 0.55 + Math.sin(t * 22) * 0.08;
    } else if (action === "punch") {
      hips.current.rotation.y = 0.45;
      hips.current.rotation.z = -0.08;
      hips.current.rotation.x = 0.05;
    } else if (action === "toast") {
      hips.current.rotation.z = Math.sin(t * 10) * 0.08;
      hips.current.rotation.x = 0;
      hips.current.rotation.y = 0;
    } else {
      hips.current.rotation.z = 0;
      hips.current.rotation.x = 0;
      hips.current.rotation.y = 0;
    }

    if (head.current) {
      if (action === "hurt") {
        head.current.rotation.x = 0.55 + Math.sin(t * 24) * 0.12;
        head.current.rotation.z = Math.sin(t * 18) * 0.15;
      } else {
        head.current.rotation.x = 0;
        head.current.rotation.z = 0;
      }
    }

    if (leftArm.current && rightArm.current) {
      if (action === "punch") {
        // Wind-up then chop the back of the head.
        const chop = Math.sin(t * 16);
        leftArm.current.rotation.x = 0.35;
        leftArm.current.rotation.z = 0.25;
        rightArm.current.rotation.x = -2.35 + chop * 1.15;
        rightArm.current.rotation.z = -1.05 - chop * 0.25;
        rightArm.current.rotation.y = 0.55;
      } else if (action === "hurt") {
        leftArm.current.rotation.x = -1.1;
        rightArm.current.rotation.x = -1.1;
        leftArm.current.rotation.z = 0.7;
        rightArm.current.rotation.z = -0.7;
        rightArm.current.rotation.y = 0;
      } else if (action === "toast") {
        // Both arms thrust glass forward for 짠!
        const thrust = 0.55 + Math.sin(t * 14) * 0.12;
        leftArm.current.rotation.x = -1.15 - thrust * 0.15;
        rightArm.current.rotation.x = -1.25 - thrust * 0.2;
        leftArm.current.rotation.z = 0.35;
        rightArm.current.rotation.z = -0.35;
        rightArm.current.rotation.y = 0;
      } else if (action === "grill") {
        leftArm.current.rotation.x = 0.2;
        rightArm.current.rotation.x = -1.1 + Math.sin(t * 12) * 0.35;
        leftArm.current.rotation.z = 0.15;
        rightArm.current.rotation.z = -0.25;
        rightArm.current.rotation.y = 0;
      } else if (action === "pour") {
        leftArm.current.rotation.x = 0.2;
        rightArm.current.rotation.x = -0.9;
        leftArm.current.rotation.z = 0.15;
        rightArm.current.rotation.z = -0.55;
        rightArm.current.rotation.y = 0;
      } else if (seated) {
        leftArm.current.rotation.x = 0.55;
        rightArm.current.rotation.x = 0.55;
        leftArm.current.rotation.z = 0.2;
        rightArm.current.rotation.z = -0.2;
        rightArm.current.rotation.y = 0;
      } else {
        const swing = isMoving ? walk * 0.85 : Math.sin(t * 2 + bobPhase) * 0.06;
        leftArm.current.rotation.x = swing;
        rightArm.current.rotation.x = -swing;
        leftArm.current.rotation.z = 0.12;
        rightArm.current.rotation.z = -0.12;
        rightArm.current.rotation.y = 0;
      }
    }

    if (leftFore.current && rightFore.current) {
      leftFore.current.rotation.x =
        action === "toast" ? 0.55 : seated ? 0.35 : isMoving ? 0.25 : 0.15;
      rightFore.current.rotation.x =
        action === "toast" ? 0.45 : seated ? 0.35 : isMoving ? 0.25 : 0.15;
    }

    if (glass.current) {
      if (action === "toast") {
        const pulse = Math.sin(t * 14) * 0.08;
        glass.current.position.set(0.02, -0.62 + pulse, 0.28 + Math.abs(pulse));
        glass.current.rotation.set(-0.85 + pulse, 0.1, 0.2);
      } else {
        glass.current.position.set(0.02, -0.72, 0.08);
        glass.current.rotation.set(0.2, 0, 0.15);
      }
    }

    if (leftLeg.current && rightLeg.current) {
      if (seated) {
        leftLeg.current.rotation.x = -1.35;
        rightLeg.current.rotation.x = -1.35;
      } else {
        const swing = isMoving ? walk * 0.95 : 0;
        leftLeg.current.rotation.x = -swing;
        rightLeg.current.rotation.x = swing;
      }
    }
  });

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      scale={scale}
      onClick={
        onHit
          ? (event) => {
              event.stopPropagation();
              onHit();
            }
          : undefined
      }
      onPointerOver={
        onHit
          ? () => {
              document.body.style.cursor = "crosshair";
            }
          : undefined
      }
      onPointerOut={
        onHit
          ? () => {
              document.body.style.cursor = "auto";
            }
          : undefined
      }
    >
      <group ref={root}>
        <group ref={hips}>
          {/* Torso */}
          <mesh position={[0, 0.38, 0]} castShadow>
            <capsuleGeometry args={[isFemale ? 0.2 : 0.23, 0.38, 6, 12]} />
            <meshStandardMaterial color={shirtColor} roughness={0.55} metalness={0.05} />
          </mesh>
          {/* Waist / pants top */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[isFemale ? 0.18 : 0.2, isFemale ? 0.2 : 0.22, 0.2, 12]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>

          {/* Neck */}
          <mesh position={[0, 0.66, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.07, 0.1, 10]} />
            <meshStandardMaterial color={skinColor} roughness={0.75} />
          </mesh>

          {/* Head */}
          <group ref={head} position={[0, 0.86, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.2, 18, 18]} />
              <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>
            {/* Eyes */}
            <mesh position={[-0.07, 0.03, 0.16]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
            <mesh position={[0.07, 0.03, 0.16]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
            <mesh position={[-0.07, 0.04, 0.185]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.07, 0.04, 0.185]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            {/* Nose */}
            <mesh position={[0, -0.01, 0.19]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshStandardMaterial color="#e8c4a0" roughness={0.8} />
            </mesh>

            {isFemale ? (
              <>
                <mesh position={[0, 0.08, -0.02]} castShadow>
                  <sphereGeometry args={[0.22, 14, 14]} />
                  <meshStandardMaterial color={hairColor} roughness={0.85} />
                </mesh>
                <mesh position={[-0.16, -0.08, 0]} castShadow>
                  <sphereGeometry args={[0.09, 10, 10]} />
                  <meshStandardMaterial color={hairColor} />
                </mesh>
                <mesh position={[0.16, -0.08, 0]} castShadow>
                  <sphereGeometry args={[0.09, 10, 10]} />
                  <meshStandardMaterial color={hairColor} />
                </mesh>
              </>
            ) : (
              <mesh position={[0, 0.08, -0.03]} castShadow>
                <sphereGeometry args={[0.21, 14, 12, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>
            )}

          </group>

          {/* Left arm */}
          <group ref={leftArm} position={[-(isFemale ? 0.28 : 0.32), 0.52, 0]}>
            <mesh position={[0, -0.16, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.22, 4, 8]} />
              <meshStandardMaterial color={shirtColor} roughness={0.55} />
            </mesh>
            <mesh ref={leftFore} position={[0, -0.4, 0]} castShadow>
              <capsuleGeometry args={[0.045, 0.2, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.58, 0]} castShadow>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>
          </group>

          {/* Right arm */}
          <group ref={rightArm} position={[isFemale ? 0.28 : 0.32, 0.52, 0]}>
            <mesh position={[0, -0.16, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.22, 4, 8]} />
              <meshStandardMaterial color={shirtColor} roughness={0.55} />
            </mesh>
            <mesh ref={rightFore} position={[0, -0.4, 0]} castShadow>
              <capsuleGeometry args={[0.045, 0.2, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.58, 0]} castShadow>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>
            {action === "toast" ? (
              <group ref={glass}>
                <BeerGlass position={[0, 0, 0]} />
              </group>
            ) : null}
          </group>

          {/* Left leg */}
          <group ref={leftLeg} position={[-0.1, 0, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow>
              <capsuleGeometry args={[0.07, 0.28, 4, 8]} />
              <meshStandardMaterial color={pantsColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.52, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.24, 4, 8]} />
              <meshStandardMaterial color={pantsColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.72, 0.04]} rotation={[0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.12, 0.07, 0.2]} />
              <meshStandardMaterial color={shoeColor} roughness={0.85} />
            </mesh>
          </group>

          {/* Right leg */}
          <group ref={rightLeg} position={[0.1, 0, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow>
              <capsuleGeometry args={[0.07, 0.28, 4, 8]} />
              <meshStandardMaterial color={pantsColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.52, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.24, 4, 8]} />
              <meshStandardMaterial color={pantsColor} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.72, 0.04]} rotation={[0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.12, 0.07, 0.2]} />
              <meshStandardMaterial color={shoeColor} roughness={0.85} />
            </mesh>
          </group>
        </group>
        <NamePlate
          name={name}
          bubble={speech}
          accent={isSelf ? "#fbbf24" : isFemale ? "#fb7185" : "#38bdf8"}
        />
      </group>
    </group>
  );
}
