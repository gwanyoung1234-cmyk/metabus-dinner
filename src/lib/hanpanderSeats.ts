import type { SeatDef, TableDef } from "@/lib/seats";

/** Long BBQ row like the photo: wall bench + opposite chairs. */
export function buildHanpanderLayout(): { tables: TableDef[]; seats: SeatDef[] } {
  const tables: TableDef[] = [];
  const seats: SeatDef[] = [];

  const count = 5;
  const gapZ = 3.4;
  const originZ = -((count - 1) * gapZ) / 2;
  const tableX = 2.2;

  for (let i = 0; i < count; i += 1) {
    const tableId = `hp-t-${i}`;
    const z = originZ + i * gapZ;
    tables.push({ id: tableId, position: [tableX, 0, z], raised: false });

    // Bench against green wall (left of table, facing +X)
    seats.push({
      id: `${tableId}-bench`,
      tableId,
      position: [tableX - 1.15, 0, z],
      rotationY: Math.PI / 2,
    });
    // Chair opposite (right of table, facing -X)
    seats.push({
      id: `${tableId}-chair`,
      tableId,
      position: [tableX + 1.15, 0, z],
      rotationY: -Math.PI / 2,
    });
  }

  return { tables, seats };
}

export const HANPANDER_LAYOUT = buildHanpanderLayout();
export const HANPANDER_SEAT_IDS = HANPANDER_LAYOUT.seats.map((seat) => seat.id);

/** Lobster NPC sits on first table bench — reserved, not claimable. */
export const LOBSTER_SEAT_ID = "hp-t-0-bench";
export const LOBSTER_NPC = {
  id: "npc-lobster",
  name: "랍스타",
  seatId: LOBSTER_SEAT_ID,
};
