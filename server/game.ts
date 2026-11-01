import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { ALL_SEAT_IDS, HALL_LAYOUT } from "../src/lib/seats";
import { MENU, type MenuId } from "../src/lib/menu";
import { randomToastLine } from "../src/lib/dialogue";
import type {
  ClientToServerEvents,
  DeliveryState,
  OrderState,
  PlayerState,
  RoomState,
  ServerToClientEvents,
  VoteState,
} from "../src/types/presence";

const DEFAULT_ROOM = "dinner";
const DELIVERY_MS = 3600;
const SPAWN = { x: 0, z: 7.2, rotationY: Math.PI };
const BOUNDS = { minX: -13.5, maxX: 13.5, minZ: -11.5, maxZ: 8.5 };

type SocketData = {
  roomId: string;
  playerId: string;
};

function clampMove(x: number, z: number) {
  return {
    x: Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, x)),
    z: Math.min(BOUNDS.maxZ, Math.max(BOUNDS.minZ, z)),
  };
}

function emptyVote(): VoteState {
  return { open: true, yes: 0, no: 0, voters: [] };
}

export function attachGameSocket(httpServer: HttpServer) {
  const rooms = new Map<string, RoomState>();
  const deliveryTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: { origin: true, methods: ["GET", "POST"] },
  });

  function getOrCreateRoom(roomId: string): RoomState {
    const existing = rooms.get(roomId);
    if (existing) return existing;

    const created: RoomState = {
      roomId,
      players: [],
      seats: {},
      orders: [],
      delivery: null,
      vote: emptyVote(),
      stageMessage: "부어치킨 회식홀 — 빈 자리에 앉아 주문·건배하세요",
    };
    rooms.set(roomId, created);
    return created;
  }

  function publicState(room: RoomState): RoomState {
    return {
      ...room,
      players: room.players.map((player) => ({ ...player })),
      seats: { ...room.seats },
      orders: room.orders.map((order) => ({ ...order })),
      delivery: room.delivery ? { ...room.delivery } : null,
      vote: { ...room.vote, voters: [...room.vote.voters] },
    };
  }

  function rankStageMessage(room: RoomState): string {
    const top = [...room.players].sort((a, b) => b.toastCount - a.toastCount)[0];
    if (!top || top.toastCount === 0) {
      return "부어치킨 회식홀 — 빈 자리에 앉아 주문·건배하세요";
    }
    return `오늘의 건배왕: ${top.name} (${top.toastCount}잔)`;
  }

  function emitRoom(room: RoomState) {
    io.to(room.roomId).emit("roomState", publicState(room));
  }

  function tableIdFromSeat(seatId: string): string | null {
    const seat = HALL_LAYOUT.seats.find((entry) => entry.id === seatId);
    return seat?.tableId ?? null;
  }

  function isMenuId(value: string): value is MenuId {
    return MENU.some((item) => item.id === value);
  }

  function startNextDelivery(room: RoomState) {
    if (room.delivery) return;
    const next = room.orders.find((order) => order.status === "queued");
    if (!next) return;

    next.status = "delivering";
    const delivery: DeliveryState = {
      orderId: next.id,
      tableId: next.tableId,
      menuId: next.menuId,
      startedAt: Date.now(),
    };
    room.delivery = delivery;
    room.stageMessage = `알바생이 ${next.playerName} 님 테이블로 메뉴를 나릅니다…`;
    emitRoom(room);

    const existingTimer = deliveryTimers.get(room.roomId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      const current = rooms.get(room.roomId);
      if (!current) return;
      const order = current.orders.find((entry) => entry.id === next.id);
      if (order && order.status === "delivering") {
        order.status = "served";
        const menuName = MENU.find((item) => item.id === order.menuId)?.name ?? "메뉴";
        current.stageMessage = `${order.playerName} 님 테이블에 ${menuName} 도착!`;
      }
      current.delivery = null;
      emitRoom(current);
      deliveryTimers.delete(room.roomId);
      startNextDelivery(current);
    }, DELIVERY_MS);

    deliveryTimers.set(room.roomId, timer);
  }

  io.on("connection", (socket) => {
    socket.on("join", ({ roomId, name, gender }) => {
      const room = getOrCreateRoom(roomId || DEFAULT_ROOM);
      const trimmed = name.trim().slice(0, 12) || `손님${socket.id.slice(0, 4)}`;
      const resolvedGender = gender === "female" ? "female" : "male";

      const player: PlayerState = {
        id: socket.id,
        name: trimmed,
        gender: resolvedGender,
        seatId: null,
        x: SPAWN.x,
        z: SPAWN.z,
        rotationY: SPAWN.rotationY,
        lastAction: "idle",
        toastCount: 0,
      };

      room.players = room.players.filter((entry) => entry.id !== socket.id);
      room.players.push(player);
      socket.data.roomId = room.roomId;
      socket.data.playerId = socket.id;
      socket.join(room.roomId);

      room.stageMessage = rankStageMessage(room);
      emitRoom(room);
    });

    socket.on("claimSeat", ({ seatId }) => {
      const roomId = socket.data.roomId;
      if (!roomId) {
        socket.emit("errorMessage", { message: "먼저 방에 입장해 주세요." });
        return;
      }
      const room = rooms.get(roomId);
      if (!room) return;

      if (!ALL_SEAT_IDS.includes(seatId)) {
        socket.emit("errorMessage", { message: "존재하지 않는 자리입니다." });
        return;
      }

      if (room.seats[seatId] && room.seats[seatId] !== socket.id) {
        socket.emit("errorMessage", { message: "이미 누군가 앉은 자리입니다." });
        return;
      }

      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player) {
        socket.emit("errorMessage", { message: "플레이어 정보가 없습니다. 새로고침 해주세요." });
        return;
      }

      if (player.seatId) {
        delete room.seats[player.seatId];
      }

      const seat = HALL_LAYOUT.seats.find((entry) => entry.id === seatId);
      player.seatId = seatId;
      room.seats[seatId] = socket.id;
      if (seat) {
        player.x = seat.position[0];
        player.z = seat.position[2];
        player.rotationY = seat.rotationY;
      }
      const next = publicState(room);
      io.to(room.roomId).emit("roomState", next);
      socket.emit("roomState", next);
    });

    socket.on("move", ({ x, z, rotationY }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player) return;

      if (player.seatId) {
        delete room.seats[player.seatId];
        player.seatId = null;
        player.lastAction = "idle";
      }

      const next = clampMove(x, z);
      player.x = next.x;
      player.z = next.z;
      player.rotationY = rotationY;
      emitRoom(room);
    });

    socket.on("leaveSeat", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player?.seatId) return;

      const seat = HALL_LAYOUT.seats.find((entry) => entry.id === player.seatId);
      delete room.seats[player.seatId];
      player.seatId = null;
      player.lastAction = "idle";
      if (seat) {
        const next = clampMove(
          seat.position[0] + Math.sin(seat.rotationY) * 0.7,
          seat.position[2] + Math.cos(seat.rotationY) * 0.7,
        );
        player.x = next.x;
        player.z = next.z;
        player.rotationY = seat.rotationY + Math.PI;
      }
      emitRoom(room);
    });

    socket.on("order", ({ menuId }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player) return;

      if (!player.seatId) {
        socket.emit("errorMessage", { message: "먼저 자리에 앉아 주세요." });
        return;
      }
      if (!isMenuId(menuId)) {
        socket.emit("errorMessage", { message: "없는 메뉴입니다." });
        return;
      }

      const tableId = tableIdFromSeat(player.seatId);
      if (!tableId) {
        socket.emit("errorMessage", { message: "테이블을 찾지 못했습니다." });
        return;
      }

      const pendingForPlayer = room.orders.filter(
        (order) =>
          order.playerId === player.id &&
          (order.status === "queued" || order.status === "delivering"),
      ).length;
      if (pendingForPlayer >= 3) {
        socket.emit("errorMessage", { message: "주문이 밀려 있어요. 조금만 기다려 주세요." });
        return;
      }

      const menuName = MENU.find((item) => item.id === menuId)?.name ?? "메뉴";
      const order: OrderState = {
        id: `${socket.id}-${Date.now()}`,
        menuId,
        playerId: player.id,
        playerName: player.name,
        seatId: player.seatId,
        tableId,
        status: "queued",
        at: Date.now(),
      };
      room.orders.push(order);
      room.stageMessage = `${player.name} 님의 ${menuName} 주문!`;
      emitRoom(room);
      startNextDelivery(room);
    });

    socket.on("action", ({ type }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player) return;

      if (!player.seatId) {
        socket.emit("errorMessage", { message: "먼저 자리에 앉아 주세요." });
        return;
      }

      player.lastAction = type;
      if (type === "toast") {
        player.toastCount += 1;
        room.stageMessage = rankStageMessage(room);
        io.to(room.roomId).emit("toast", {
          playerId: player.id,
          name: player.name,
          line: randomToastLine(),
          at: Date.now(),
        });
      } else if (type === "pour") {
        room.stageMessage = `${player.name} 님이 술을 따릅니다.`;
      } else if (type === "snack") {
        room.stageMessage = `${player.name} 님이 안주를 집었습니다.`;
      }

      emitRoom(room);

      setTimeout(() => {
        const current = rooms.get(roomId);
        const target = current?.players.find((entry) => entry.id === socket.id);
        if (!current || !target) return;
        if (target.lastAction === type) {
          target.lastAction = "idle";
          emitRoom(current);
        }
      }, 1800);
    });

    socket.on("vote", ({ choice }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player) return;

      if (!room.vote.open) {
        room.vote = emptyVote();
      }

      if (room.vote.voters.includes(player.id)) {
        socket.emit("errorMessage", { message: "이미 투표했습니다." });
        return;
      }

      room.vote.voters.push(player.id);
      if (choice === "yes") room.vote.yes += 1;
      else room.vote.no += 1;

      if (room.vote.voters.length >= Math.max(1, Math.ceil(room.players.length * 0.5))) {
        room.vote.open = false;
        room.stageMessage =
          room.vote.yes >= room.vote.no
            ? "가결! 강제 2차로 이동합니다. (민주주의의 승리)"
            : "부결...? 그래도 2차입니다. (회사의 승리)";
      } else {
        room.stageMessage = `2차 투표 진행 중 — 찬성 ${room.vote.yes} / 반대 ${room.vote.no}`;
      }

      emitRoom(room);
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find((entry) => entry.id === socket.id);
      if (player?.seatId) {
        delete room.seats[player.seatId];
      }
      room.players = room.players.filter((entry) => entry.id !== socket.id);
      room.vote.voters = room.vote.voters.filter((id) => id !== socket.id);
      room.orders = room.orders.filter(
        (order) => order.playerId !== socket.id || order.status === "served",
      );
      if (room.delivery) {
        const active = room.orders.find((order) => order.id === room.delivery?.orderId);
        if (!active || active.status !== "delivering") {
          room.delivery = null;
          const timer = deliveryTimers.get(roomId);
          if (timer) clearTimeout(timer);
          deliveryTimers.delete(roomId);
        }
      }
      room.stageMessage = rankStageMessage(room);

      if (room.players.length === 0) {
        const timer = deliveryTimers.get(roomId);
        if (timer) clearTimeout(timer);
        deliveryTimers.delete(roomId);
        rooms.delete(roomId);
      } else {
        emitRoom(room);
        startNextDelivery(room);
      }
    });
  });

  return io;
}
