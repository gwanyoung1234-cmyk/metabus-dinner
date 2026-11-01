import type { SeatDef, TableDef } from "@/lib/seats";

/** Wide BBQ hall: wall booths + opposite chairs with a broad aisle. */
export function buildHanpanderLayout(): { tables: TableDef[]; seats: SeatDef[] } {
  const tables: TableDef[] = [];
  const seats: SeatDef[] = [];

  const count = 6;
  const gapZ = 3.8;
  const originZ = -((count - 1) * gapZ) / 2;
  const tableX = 3.6;

  for (let i = 0; i < count; i += 1) {
    const tableId = `hp-t-${i}`;
    const z = originZ + i * gapZ;
    tables.push({ id: tableId, position: [tableX, 0, z], raised: false });

    seats.push({
      id: `${tableId}-bench`,
      tableId,
      position: [tableX - 1.2, 0, z],
      rotationY: Math.PI / 2,
    });
    seats.push({
      id: `${tableId}-chair`,
      tableId,
      position: [tableX + 1.25, 0, z],
      rotationY: -Math.PI / 2,
    });
  }

  return { tables, seats };
}

export const HANPANDER_LAYOUT = buildHanpanderLayout();
export const HANPANDER_SEAT_IDS = HANPANDER_LAYOUT.seats.map((seat) => seat.id);

export const LOBSTER_SEAT_ID = "hp-t-0-bench";
export const LOBSTER_NPC = {
  id: "npc-lobster",
  name: "랍스타",
  seatId: LOBSTER_SEAT_ID,
};

/** Keep camera inside the remodeled hall. */
export const HANPANDER_CAM_BOUNDS = {
  minX: -1.5,
  maxX: 12.8,
  minZ: -12.5,
  maxZ: 12.5,
  minY: 1.4,
  maxY: 4.0,
};

export const HANPANDER_MOVE_BOUNDS = {
  minX: -0.8,
  maxX: 12.2,
  minZ: -11.5,
  maxZ: 11.5,
};
