"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { RAISED_PLATFORM_Y } from "@/lib/seats";
import { getSocket } from "@/services/socket";
import type { PlayerAction, PlayerGender } from "@/types/presence";
import { Avatar } from "./Avatar";

const SPEED = 4.2;
const BOUNDS = { minX: -13.5, maxX: 13.5, minZ: -11.5, maxZ: 8.5 };
const SEND_MS = 80;

function floorY(z: number) {
  return z < -3.7 ? RAISED_PLATFORM_Y : 0;
}

export function LocalPlayer({
  name,
  gender,
  action,
  seated,
  seatPosition,
  seatRotationY,
  x,
  z,
  rotationY,
}: {
  name: string;
  gender: PlayerGender;
  action: PlayerAction;
  seated: boolean;
  seatPosition: [number, number, number] | null;
  seatRotationY: number;
  x: number;
  z: number;
  rotationY: number;
}) {
  const root = useRef<Group>(null);
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const pose = useRef({ x, z, rotationY });
  const lastSent = useRef(0);

  useEffect(() => {
    if (seated && seatPosition) {
      pose.current = {
        x: seatPosition[0],
        z: seatPosition[2],
        rotationY: seatRotationY,
      };
      return;
    }
    pose.current = { x, z, rotationY };
  }, [x, z, rotationY, seated, seatPosition, seatRotationY]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
      }
      if (key === "w" || key === "arrowup") keys.current.w = true;
      if (key === "s" || key === "arrowdown") keys.current.s = true;
      if (key === "a" || key === "arrowleft") keys.current.a = true;
      if (key === "d" || key === "arrowright") keys.current.d = true;
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "w" || key === "arrowup") keys.current.w = false;
      if (key === "s" || key === "arrowdown") keys.current.s = false;
      if (key === "a" || key === "arrowleft") keys.current.a = false;
      if (key === "d" || key === "arrowright") keys.current.d = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((state, delta) => {
    if (!root.current) return;
    const camera = state.camera;

    if (seated && seatPosition) {
      root.current.position.set(seatPosition[0], seatPosition[1] + 0.42, seatPosition[2]);
      root.current.rotation.y = seatRotationY;
      const camX = seatPosition[0] - Math.sin(seatRotationY) * 5.5;
      const camZ = seatPosition[2] - Math.cos(seatRotationY) * 5.5;
      camera.position.x += (camX - camera.position.x) * 0.08;
      camera.position.y += (seatPosition[1] + 3.6 - camera.position.y) * 0.08;
      camera.position.z += (camZ - camera.position.z) * 0.08;
      camera.lookAt(seatPosition[0], seatPosition[1] + 1.3, seatPosition[2]);

      const { w, a, s, d } = keys.current;
      if (w || a || s || d) {
        getSocket().emit("leaveSeat");
      }
      return;
    }

    const { w, a, s, d } = keys.current;
    let { x: px, z: pz, rotationY: rot } = pose.current;
    if (w || a || s || d) {
      let dx = 0;
      let dz = 0;
      if (w) dz -= 1;
      if (s) dz += 1;
      if (a) dx -= 1;
      if (d) dx += 1;
      const len = Math.hypot(dx, dz) || 1;
      dx = (dx / len) * SPEED * delta;
      dz = (dz / len) * SPEED * delta;
      px = Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, px + dx));
      pz = Math.min(BOUNDS.maxZ, Math.max(BOUNDS.minZ, pz + dz));
      rot = Math.atan2(dx, dz);
      pose.current = { x: px, z: pz, rotationY: rot };

      const now = performance.now();
      if (now - lastSent.current > SEND_MS) {
        lastSent.current = now;
        getSocket().emit("move", { x: px, z: pz, rotationY: rot });
      }
    }

    const y = floorY(pose.current.z);
    root.current.position.set(pose.current.x, y, pose.current.z);
    root.current.rotation.y = pose.current.rotationY;

    const camX = pose.current.x - Math.sin(pose.current.rotationY) * 6.5;
    const camZ = pose.current.z - Math.cos(pose.current.rotationY) * 6.5;
    camera.position.x += (camX - camera.position.x) * 0.1;
    camera.position.y += (y + 4.2 - camera.position.y) * 0.1;
    camera.position.z += (camZ - camera.position.z) * 0.1;
    camera.lookAt(pose.current.x, y + 1.2, pose.current.z);
  });

  return (
    <group ref={root}>
      <Avatar
        name={name}
        gender={gender}
        action={action}
        isSelf
        seated={seated}
        position={[0, seated ? 0 : 0, 0]}
        rotationY={0}
      />
    </group>
  );
}
