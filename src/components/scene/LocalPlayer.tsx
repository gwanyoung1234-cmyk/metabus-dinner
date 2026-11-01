"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { RAISED_PLATFORM_Y } from "@/lib/seats";
import { getSocket } from "@/services/socket";
import type { PlayerAction, PlayerGender } from "@/types/presence";
import { Avatar } from "./Avatar";

const SPEED = 4.2;
const BOUNDS = { minX: -13.5, maxX: 14, minZ: -12, maxZ: 10 };
const SEND_MS = 80;
const ARRIVE = 0.18;
const CAM_DIST = 7.2;
const CAM_HEIGHT = 4.0;
const CAM_LOOK_Y = 1.15;
const SEAT_CAM_DIST = 3.2;
const SEAT_CAM_HEIGHT = 2.6;

function floorY(z: number) {
  return z < -3.7 ? RAISED_PLATFORM_Y : 0;
}

function lerpAngle(from: number, to: number, t: number) {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return from + diff * t;
}

function FloorClickPads({
  onFloorClick,
}: {
  onFloorClick: (x: number, z: number) => void;
}) {
  const handle = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    onFloorClick(event.point.x, event.point.z);
  };

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 1]}
        onPointerDown={handle}
      >
        <planeGeometry args={[42, 28]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, RAISED_PLATFORM_Y + 0.03, -8.4]}
        onPointerDown={handle}
      >
        <planeGeometry args={[28, 9.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
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
  const mouseGoal = useRef<{ x: number; z: number } | null>(null);
  const pose = useRef({ x, z, rotationY });
  const camYaw = useRef(rotationY);
  const look = useRef({ x, y: CAM_LOOK_Y, z });
  const lastSent = useRef(0);
  const movingRef = useRef(false);
  const wasSeated = useRef(seated);

  // Local player is authority while walking — only adopt server pose when stand/sit changes.
  useEffect(() => {
    if (seated && seatPosition) {
      pose.current = {
        x: seatPosition[0],
        z: seatPosition[2],
        rotationY: seatRotationY,
      };
      camYaw.current = seatRotationY;
      mouseGoal.current = null;
      movingRef.current = false;
    } else if (wasSeated.current && !seated) {
      pose.current = { x, z, rotationY };
      camYaw.current = rotationY;
    }
    wasSeated.current = seated;
  }, [seated, seatPosition, seatRotationY, x, z, rotationY]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
        mouseGoal.current = null;
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

  function onFloorClick(gx: number, gz: number) {
    const tx = Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, gx));
    const tz = Math.min(BOUNDS.maxZ, Math.max(BOUNDS.minZ, gz));
    mouseGoal.current = { x: tx, z: tz };
    if (seated) {
      getSocket().emit("leaveSeat");
    }
  }

  useFrame((state, delta) => {
    if (!root.current) return;
    const camera = state.camera;
    const dt = Math.min(delta, 0.05);
    const follow = 1 - Math.exp(-3.2 * dt);
    const yawFollow = 1 - Math.exp(-2.4 * dt);

    if (seated && seatPosition) {
      // Leftover click-to-move must not instantly stand us back up.
      mouseGoal.current = null;
      root.current.position.set(seatPosition[0], seatPosition[1] + 0.42, seatPosition[2]);
      root.current.rotation.y = seatRotationY;

      // Short over-the-shoulder view — avoids clipping into tables/walls.
      const faceX = Math.sin(seatRotationY);
      const faceZ = Math.cos(seatRotationY);
      const targetCamX = seatPosition[0] - faceX * SEAT_CAM_DIST;
      const targetCamZ = seatPosition[2] - faceZ * SEAT_CAM_DIST;
      const targetCamY = Math.min(5.4, seatPosition[1] + SEAT_CAM_HEIGHT);
      const lookX = seatPosition[0] + faceX * 0.9;
      const lookY = seatPosition[1] + 1.15;
      const lookZ = seatPosition[2] + faceZ * 0.9;

      camera.position.x += (targetCamX - camera.position.x) * follow;
      camera.position.y += (targetCamY - camera.position.y) * follow;
      camera.position.z += (targetCamZ - camera.position.z) * follow;
      look.current.x += (lookX - look.current.x) * follow;
      look.current.y += (lookY - look.current.y) * follow;
      look.current.z += (lookZ - look.current.z) * follow;
      camera.lookAt(look.current.x, look.current.y, look.current.z);

      const { w, a, s, d } = keys.current;
      if (w || a || s || d) {
        getSocket().emit("leaveSeat");
      }
      movingRef.current = false;
      return;
    }

    const { w, a, s, d } = keys.current;
    let { x: px, z: pz, rotationY: rot } = pose.current;
    let dx = 0;
    let dz = 0;

    if (w || a || s || d) {
      if (w) dz -= 1;
      if (s) dz += 1;
      if (a) dx -= 1;
      if (d) dx += 1;
    } else if (mouseGoal.current) {
      const gx = mouseGoal.current.x - px;
      const gz = mouseGoal.current.z - pz;
      const dist = Math.hypot(gx, gz);
      if (dist <= ARRIVE) {
        mouseGoal.current = null;
      } else {
        dx = gx / dist;
        dz = gz / dist;
      }
    }

    const moving = Math.hypot(dx, dz) > 0;
    movingRef.current = moving;

    if (moving) {
      const len = Math.hypot(dx, dz) || 1;
      dx = (dx / len) * SPEED * dt;
      dz = (dz / len) * SPEED * dt;
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

    // Smooth camera yaw so strafing/turns don't whip the view.
    camYaw.current = lerpAngle(camYaw.current, pose.current.rotationY, moving ? yawFollow : yawFollow * 0.35);

    const targetCamX = pose.current.x - Math.sin(camYaw.current) * CAM_DIST;
    const targetCamZ = pose.current.z - Math.cos(camYaw.current) * CAM_DIST;
    const targetCamY = y + CAM_HEIGHT;
    const lookX = pose.current.x;
    const lookY = y + CAM_LOOK_Y;
    const lookZ = pose.current.z;

    camera.position.x += (targetCamX - camera.position.x) * follow;
    camera.position.y += (targetCamY - camera.position.y) * follow;
    camera.position.z += (targetCamZ - camera.position.z) * follow;
    look.current.x += (lookX - look.current.x) * follow;
    look.current.y += (lookY - look.current.y) * follow;
    look.current.z += (lookZ - look.current.z) * follow;
    camera.lookAt(look.current.x, look.current.y, look.current.z);
  });

  return (
    <>
      <FloorClickPads onFloorClick={onFloorClick} />
      <group ref={root}>
        <Avatar
          name={name}
          gender={gender}
          action={action}
          isSelf
          seated={seated}
          movingRef={movingRef}
          position={[0, 0, 0]}
          rotationY={0}
        />
      </group>
    </>
  );
}
