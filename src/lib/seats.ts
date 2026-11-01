export interface SeatDef {
  id: string;
  tableId: string;
  position: [number, number, number];
  rotationY: number;
}

export interface TableDef {
  id: string;
  position: [number, number, number];
  raised: boolean;
}

export const RAISED_PLATFORM_Y = 0.42;

const TABLE_COLS = 4;
const TABLE_ROWS = 5;
const TABLE_GAP_X = 5.4;
const TABLE_GAP_Z = 4.5;

/** Generate a Boor-style hall: front floor + raised rear platform. */
export function buildHallLayout(): { tables: TableDef[]; seats: SeatDef[] } {
  const tables: TableDef[] = [];
  const seats: SeatDef[] = [];

  const originX = -((TABLE_COLS - 1) * TABLE_GAP_X) / 2;
  const originZ = -((TABLE_ROWS - 1) * TABLE_GAP_Z) / 2 + 1.2;

  for (let row = 0; row < TABLE_ROWS; row += 1) {
    for (let col = 0; col < TABLE_COLS; col += 1) {
      const tableId = `t-${row}-${col}`;
      const raised = row >= 3;
      const y = raised ? RAISED_PLATFORM_Y : 0;
      const x = originX + col * TABLE_GAP_X;
      const z = originZ + row * TABLE_GAP_Z;
      tables.push({ id: tableId, position: [x, y, z], raised });

      const offsets: Array<{
        dx: number;
        dz: number;
        rotationY: number;
        idx: number;
      }> = [
        { dx: -1.15, dz: 0.75, rotationY: Math.PI / 2, idx: 0 },
        { dx: 1.15, dz: 0.75, rotationY: -Math.PI / 2, idx: 1 },
        { dx: -1.15, dz: -0.75, rotationY: Math.PI / 2, idx: 2 },
        { dx: 1.15, dz: -0.75, rotationY: -Math.PI / 2, idx: 3 },
      ];

      for (const offset of offsets) {
        seats.push({
          id: `${tableId}-s${offset.idx}`,
          tableId,
          position: [x + offset.dx, y, z + offset.dz],
          rotationY: offset.rotationY,
        });
      }
    }
  }

  return { tables, seats };
}

export const HALL_LAYOUT = buildHallLayout();
export const ALL_SEAT_IDS = HALL_LAYOUT.seats.map((seat) => seat.id);
