export type CamBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
};

export type MoveBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export const BOOR_CAM_BOUNDS: CamBounds = {
  minX: -13.8,
  maxX: 13.8,
  minZ: -11.8,
  maxZ: 9.2,
  minY: 1.6,
  maxY: 5.2,
};

export const BOOR_MOVE_BOUNDS: MoveBounds = {
  minX: -13.5,
  maxX: 13.5,
  minZ: -11.5,
  maxZ: 8.5,
};

/** Pull camera in until the point sits inside the room volume. */
export function fitCameraBehind(
  px: number,
  py: number,
  pz: number,
  yaw: number,
  preferredDist: number,
  preferredHeight: number,
  bounds: CamBounds,
): { x: number; y: number; z: number } {
  let dist = preferredDist;
  let x = px - Math.sin(yaw) * dist;
  let z = pz - Math.cos(yaw) * dist;
  let y = py + preferredHeight;

  for (let i = 0; i < 18 && dist > 2.2; i += 1) {
    const outside =
      x < bounds.minX ||
      x > bounds.maxX ||
      z < bounds.minZ ||
      z > bounds.maxZ ||
      y < bounds.minY ||
      y > bounds.maxY;
    if (!outside) break;
    dist -= 0.35;
    x = px - Math.sin(yaw) * dist;
    z = pz - Math.cos(yaw) * dist;
    y = Math.min(bounds.maxY, py + preferredHeight * (0.55 + dist / preferredDist));
  }

  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, y)),
    z: Math.min(bounds.maxZ, Math.max(bounds.minZ, z)),
  };
}
