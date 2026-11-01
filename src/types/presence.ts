import type { MenuId } from "@/lib/menu";

export type PlayerAction = "idle" | "toast" | "pour" | "snack";
export type PlayerGender = "male" | "female";
export type OrderStatus = "queued" | "delivering" | "served";

export interface PlayerState {
  id: string;
  name: string;
  gender: PlayerGender;
  seatId: string | null;
  x: number;
  z: number;
  rotationY: number;
  lastAction: PlayerAction;
  toastCount: number;
}

export interface VoteState {
  open: boolean;
  yes: number;
  no: number;
  voters: string[];
}

export interface OrderState {
  id: string;
  menuId: MenuId;
  playerId: string;
  playerName: string;
  seatId: string;
  tableId: string;
  status: OrderStatus;
  at: number;
}

export interface DeliveryState {
  orderId: string;
  tableId: string;
  menuId: MenuId;
  startedAt: number;
}

export interface RoomState {
  roomId: string;
  players: PlayerState[];
  seats: Record<string, string>;
  orders: OrderState[];
  delivery: DeliveryState | null;
  vote: VoteState;
  stageMessage: string;
}

export interface ToastEvent {
  playerId: string;
  name: string;
  line: string;
  at: number;
}

export type ClientToServerEvents = {
  join: (payload: { roomId: string; name: string; gender: PlayerGender }) => void;
  move: (payload: { x: number; z: number; rotationY: number }) => void;
  claimSeat: (payload: { seatId: string }) => void;
  leaveSeat: () => void;
  action: (payload: { type: Exclude<PlayerAction, "idle"> }) => void;
  order: (payload: { menuId: MenuId }) => void;
  vote: (payload: { choice: "yes" | "no" }) => void;
};

export type ServerToClientEvents = {
  roomState: (state: RoomState) => void;
  toast: (event: ToastEvent) => void;
  errorMessage: (payload: { message: string }) => void;
};
