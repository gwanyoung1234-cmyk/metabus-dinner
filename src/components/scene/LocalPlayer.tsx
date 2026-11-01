"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import {
  BOOR_CAM_BOUNDS,
  BOOR_MOVE_BOUNDS,
  fitCameraBehind,
  type CamBounds,
  type MoveBounds,
} from "@/lib/cameraBounds";
import { RAISED_PLATFORM_Y } from "@/lib/seats";
import { getSocket } from "@/services/socket";
import type { PlayerAction, PlayerGender } from "@/types/presence";
import { Avatar } from "./Avatar";

const SPEED = 4.2;
const SEND_MS = 80;
const ARRIVE = 0.18;
const CAM_DIST = 5.8;
const CAM_HEIGHT = 3.4;
const CAM_LOOK_Y = 1.15;
const SEAT_CAM_DIST = 3.0;
const SEAT_CAM_HEIGHT = 2.5;
const ZOOM_MIN = 0.55;
const ZOOM_MAX = 1.75;

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
  moveBounds,
  enabled,
}: {
  onFloorClick: (x: number, z: number) => void;
  moveBounds: MoveBounds;
  enabled: boolean;
}) {
  const handle = (event: ThreeEvent<PointerEvent>) => {
    if (!enabled || event.button !== 0) return;
    event.stopPropagation();
    onFloorClick(event.point.x, event.point.z);
  };

  const width = moveBounds.maxX - moveBounds.minX + 4;
  const depth = moveBounds.maxZ - moveBounds.minZ + 4;
  const cx = (moveBounds.minX + moveBounds.maxX) / 2;
  const cz = (moveBounds.minZ + moveBounds.maxZ) / 2;

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[cx, 0.03, cz]}
        onPointerDown={handle}
      >
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Boor raised rear platform click surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, RAISED_PLATFORM_Y + 0.04, -8.4]}
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
  camBounds = BOOR_CAM_BOUNDS,
  moveBounds = BOOR_MOVE_BOUNDS,
  speech = null,
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
  camBounds?: CamBounds;
  moveBounds?: MoveBounds;
  speech?: string | null;
}) {
  const root = useRef<Group>(null);
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const mouseGoal = useRef<{ x: number; z: number } | null>(null);
  const pose = useRef({ x, z, rotationY });
  const camYaw = useRef(rotationY);
  const look = useRef({ x, y: CAM_LOOK_Y, z });
  const zoom = useRef(1);
  const seatOrbitYaw = useRef(0);
  const seatOrbitPitch = useRef(0.18);
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastSent = useRef(0);
  const movingRef = useRef(false);
  const wasSeated = useRef(seated);

  useEffect(() => {
    if (seated && seatPosition) {
      pose.current = {
        x: seatPosition[0],
        z: seatPosition[2],
        rotationY: seatRotationY,
      };
      camYaw.current = seatRotationY;
      seatOrbitYaw.current = 0;
      seatOrbitPitch.current = 0.18;
      mouseGoal.current = null;
      movingRef.current = false;
    } else if (wasSeated.current && !seated) {
      pose.current = { x, z, rotationY };
      camYaw.current = rotationY;
      dragging.current = false;
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

    const onWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, form")) return;
      event.preventDefault();
      const next = zoom.current + (event.deltaY > 0 ? 0.08 : -0.08);
      zoom.current = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, form, a")) return;
      // Seated: drag to look around. Standing: still allow floor click-to-move.
      if (wasSeated.current || seated) {
        dragging.current = true;
        lastPointer.current = { x: event.clientX, y: event.clientY };
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging.current) return;
      const dx = event.clientX - lastPointer.current.x;
      const dy = event.clientY - lastPointer.current.y;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      seatOrbitYaw.current -= dx * 0.005;
      seatOrbitPitch.current = Math.min(
        0.85,
        Math.max(-0.15, seatOrbitPitch.current + dy * 0.004),
      );
    };
    const onPointerUp = () => {
      dragging.current = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [seated]);

  function onFloorClick(gx: number, gz: number) {
    if (seated) return; // seated uses mouse to look, not walk
    const tx = Math.min(moveBounds.maxX, Math.max(moveBounds.minX, gx));
    const tz = Math.min(moveBounds.maxZ, Math.max(moveBounds.minZ, gz));
    mouseGoal.current = { x: tx, z: tz };
  }

  useFrame((state, delta) => {
    if (!root.current) return;
    const camera = state.camera;
    const dt = Math.min(delta, 0.05);
    const follow = 1 - Math.exp(-3.4 * dt);
    const yawFollow = 1 - Math.exp(-2.2 * dt);
    const zMul = zoom.current;

    if (seated && seatPosition) {
      mouseGoal.current = null;
      root.current.position.set(seatPosition[0], seatPosition[1] + 0.42, seatPosition[2]);
      root.current.rotation.y = seatRotationY;

      const orbitYaw = seatRotationY + seatOrbitYaw.current;
      const pitch = seatOrbitPitch.current;
      const dist = SEAT_CAM_DIST * zMul;
      const height = SEAT_CAM_HEIGHT + pitch * 2.2;
      const fitted = fitCameraBehind(
        seatPosition[0],
        seatPosition[1],
        seatPosition[2],
        orbitYaw,
        dist,
        height,
        camBounds,
      );

      // Look toward a point in front of the seat, tilted by pitch.
      const lookDist = 1.4;
      const lookX =
        seatPosition[0] + Math.sin(orbitYaw) * lookDist * Math.cos(pitch * 0.8);
      const lookY = seatPosition[1] + 1.2 + pitch * 0.6;
      const lookZ =
        seatPosition[2] + Math.cos(orbitYaw) * lookDist * Math.cos(pitch * 0.8);

      camera.position.x += (fitted.x - camera.position.x) * follow;
      camera.position.y += (fitted.y - camera.position.y) * follow;
      camera.position.z += (fitted.z - camera.position.z) * follow;
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
      px = Math.min(moveBounds.maxX, Math.max(moveBounds.minX, px + dx));
      pz = Math.min(moveBounds.maxZ, Math.max(moveBounds.minZ, pz + dz));
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

    camYaw.current = lerpAngle(
      camYaw.current,
      pose.current.rotationY,
      moving ? yawFollow : yawFollow * 0.35,
    );

    const fitted = fitCameraBehind(
      pose.current.x,
      y,
      pose.current.z,
      camYaw.current,
      CAM_DIST * zMul,
      CAM_HEIGHT * (0.85 + zMul * 0.15),
      camBounds,
    );

    camera.position.x += (fitted.x - camera.position.x) * follow;
    camera.position.y += (fitted.y - camera.position.y) * follow;
    camera.position.z += (fitted.z - camera.position.z) * follow;
    look.current.x += (pose.current.x - look.current.x) * follow;
    look.current.y += (y + CAM_LOOK_Y - look.current.y) * follow;
    look.current.z += (pose.current.z - look.current.z) * follow;
    camera.lookAt(look.current.x, look.current.y, look.current.z);
  });

  return (
    <>
      <FloorClickPads
        onFloorClick={onFloorClick}
        moveBounds={moveBounds}
        enabled={!seated}
      />
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
          speech={speech}
        />
      </group>
    </>
  );
}
