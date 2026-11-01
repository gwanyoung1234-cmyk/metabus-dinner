"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActionBar } from "@/components/ui/ActionBar";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { MenuModal } from "@/components/ui/MenuModal";
import { MobileControls } from "@/components/ui/MobileControls";
import { getChannel, isChannelId } from "@/lib/channels";
import { HANPANDER_LAYOUT, LOBSTER_SEAT_ID } from "@/lib/hanpanderSeats";
import { menuForChannel, type MenuId } from "@/lib/menu";
import { HALL_LAYOUT } from "@/lib/seats";
import { getSocket } from "@/services/socket";
import type { ChatMessage, HitEvent, PlayerGender, RoomState, ToastEvent } from "@/types/presence";

const DinnerHall = dynamic(
  () => import("@/components/scene/DinnerHall").then((mod) => mod.DinnerHall),
  { ssr: false, loading: () => <div className="grid h-full place-items-center text-amber-100/60">홀 준비 중...</div> },
);

const HanpanderHall = dynamic(
  () => import("@/components/scene/HanpanderHall").then((mod) => mod.HanpanderHall),
  { ssr: false, loading: () => <div className="grid h-full place-items-center text-emerald-100/60">한판더 준비 중...</div> },
);

const EMPTY_ROOM: RoomState = {
  roomId: "boor",
  players: [],
  seats: {},
  orders: [],
  delivery: null,
  vote: { open: true, yes: 0, no: 0, voters: [] },
  stageMessage: "연결 중...",
};

export default function ChannelRoomPage() {
  const router = useRouter();
  const params = useParams<{ channel: string }>();
  const channelParam = typeof params.channel === "string" ? params.channel : "";
  const channel = isChannelId(channelParam) ? channelParam : null;
  const channelDef = channel ? getChannel(channel) : null;

  const [playerName, setPlayerName] = useState<string | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomState>(EMPTY_ROOM);
  const [toasts, setToasts] = useState<ToastEvent[]>([]);
  const [hitNotes, setHitNotes] = useState<HitEvent[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [speechById, setSpeechById] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const me = useMemo(
    () => room.players.find((player) => player.id === selfId) ?? null,
    [room.players, selfId],
  );

  const seats = channel === "hanpander" ? HANPANDER_LAYOUT.seats : HALL_LAYOUT.seats;
  const menuItems = channel ? menuForChannel(channel) : [];

  useEffect(() => {
    if (!channel) {
      router.replace("/");
      return;
    }
    const name = sessionStorage.getItem("metabus-name");
    if (!name) {
      router.replace("/");
      return;
    }
    const storedGender = sessionStorage.getItem("metabus-gender");
    const gender: PlayerGender = storedGender === "female" ? "female" : "male";

    const socket = getSocket();
    const onConnect = () => {
      setSelfId(socket.id ?? null);
      setPlayerName(name);
      socket.emit("join", { roomId: channel, name, gender });
    };
    const onRoomState = (state: RoomState) => {
      setRoom({
        ...state,
        orders: state.orders ?? [],
        delivery: state.delivery ?? null,
      });
      setSelfId(socket.id ?? null);
    };
    const onToast = (event: ToastEvent) => {
      setToasts((prev) => [event, ...prev].slice(0, 5));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.at !== event.at || item.playerId !== event.playerId));
      }, 3200);
    };
    const onHitFx = (event: HitEvent) => {
      setHitNotes((prev) => [event, ...prev].slice(0, 4));
      window.setTimeout(() => {
        setHitNotes((prev) =>
          prev.filter(
            (item) =>
              !(
                item.at === event.at &&
                item.attackerId === event.attackerId &&
                item.targetId === event.targetId
              ),
          ),
        );
      }, 2800);
    };
    const onChat = (message: ChatMessage) => {
      setChats((prev) => [...prev, message].slice(-40));
      setSpeechById((prev) => ({ ...prev, [message.playerId]: message.text }));
      window.setTimeout(() => {
        setSpeechById((prev) => {
          if (prev[message.playerId] !== message.text) return prev;
          const next = { ...prev };
          delete next[message.playerId];
          return next;
        });
      }, 4000);
    };
    const onError = (payload: { message: string }) => {
      setError(payload.message);
      window.setTimeout(() => setError(null), 2400);
    };

    socket.on("connect", onConnect);
    socket.on("roomState", onRoomState);
    socket.on("toast", onToast);
    socket.on("hitFx", onHitFx);
    socket.on("chat", onChat);
    socket.on("errorMessage", onError);
    if (socket.connected) onConnect();
    else socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("roomState", onRoomState);
      socket.off("toast", onToast);
      socket.off("hitFx", onHitFx);
      socket.off("chat", onChat);
      socket.off("errorMessage", onError);
      socket.disconnect();
    };
  }, [channel, router]);

  function sitNearby() {
    const socket = getSocket();
    if (!socket.connected) {
      setError("서버에 연결되지 않았습니다.");
      socket.connect();
      return;
    }
    if (!me) return;
    const occupied = new Set(Object.keys(room.seats));
    const empty = seats.filter(
      (seat) => !occupied.has(seat.id) && seat.id !== LOBSTER_SEAT_ID,
    );
    if (empty.length === 0) {
      setError("빈 자리가 없습니다.");
      return;
    }
    const px = me.x ?? 0;
    const pz = me.z ?? 7;
    empty.sort((a, b) => {
      const da = (a.position[0] - px) ** 2 + (a.position[2] - pz) ** 2;
      const db = (b.position[0] - px) ** 2 + (b.position[2] - pz) ** 2;
      return da - db;
    });
    const nearest = empty[0];
    if (!nearest) return;
    const dist = Math.hypot(nearest.position[0] - px, nearest.position[2] - pz);
    if (dist > 2.4) {
      setError("가까운 빈 자리로 더 다가간 뒤 앉거나, 의자를 클릭하세요.");
      return;
    }
    socket.emit("claimSeat", { seatId: nearest.id });
  }

  function claimSeat(seatId: string) {
    getSocket().emit("claimSeat", { seatId });
  }

  function leaveSeat() {
    getSocket().emit("leaveSeat");
  }

  function sendAction(type: "toast" | "grill") {
    getSocket().emit("action", { type });
  }

  function sendChat(text: string) {
    getSocket().emit("chat", { text });
  }

  function placeOrder(menuId: MenuId) {
    getSocket().emit("order", { menuId });
    setMenuOpen(false);
  }

  function hitPlayer(targetId: string) {
    getSocket().emit("hit", { targetId });
  }

  function hitLobster() {
    setError("랍스타에게 한 대! (NPC)");
    window.setTimeout(() => setError(null), 1600);
  }

  if (!channel || !channelDef || !playerName) {
    return (
      <main className="grid min-h-full place-items-center text-amber-100/70">
        입장 준비 중...
      </main>
    );
  }

  const isHanpander = channel === "hanpander";

  return (
    <main className="relative h-[100dvh] overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-visible [&_canvas]:touch-none">
        {isHanpander ? (
          <HanpanderHall
            players={room.players}
            selfId={selfId}
            orders={room.orders}
            delivery={room.delivery}
            onSeatClick={claimSeat}
            onHitPlayer={hitPlayer}
            onHitLobster={hitLobster}
            speechById={speechById}
          />
        ) : (
          <DinnerHall
            players={room.players}
            selfId={selfId}
            orders={room.orders}
            delivery={room.delivery}
            onSeatClick={claimSeat}
            onHitPlayer={hitPlayer}
            speechById={speechById}
          />
        )}
      </div>

      <header className="pointer-events-none absolute right-3 top-3 z-20 sm:right-4 sm:top-4">
        <div className="flex items-center gap-2 rounded-2xl border border-amber-900/40 bg-[rgba(18,12,8,0.82)] px-3 py-2 backdrop-blur">
          <p className="text-xs font-medium text-amber-50">접속 {room.players.length}명</p>
          <button
            type="button"
            className="pointer-events-auto rounded-lg border border-amber-800/50 px-2 py-1 text-[11px] text-amber-100/80"
            onClick={() => router.push("/")}
          >
            나가기
          </button>
        </div>
      </header>

      <MobileControls />
      <ChatPanel messages={chats} onSend={sendChat} />

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 w-[min(92vw,44rem)] -translate-x-1/2 space-y-3">
        {hitNotes.length > 0 ? (
          <ul className="space-y-1.5">
            {hitNotes.map((hit) => (
              <li
                key={`${hit.attackerId}-${hit.targetId}-${hit.at}`}
                className="rounded-xl border border-rose-700/40 bg-black/55 px-3 py-2 text-xs text-rose-50 backdrop-blur"
              >
                <span className="font-semibold text-rose-300">{hit.attackerName}</span>
                {" → "}
                <span className="font-semibold text-amber-200">{hit.targetName}</span>{" "}
                뒷통수!
              </li>
            ))}
          </ul>
        ) : null}
        {toasts.length > 0 ? (
          <ul className="space-y-1.5">
            {toasts.map((toast) => (
              <li
                key={`${toast.playerId}-${toast.at}`}
                className="rounded-xl border border-amber-700/40 bg-black/55 px-3 py-2 text-xs text-amber-50 backdrop-blur"
              >
                <span className="font-semibold text-amber-300">{toast.name}</span> — {toast.line}
              </li>
            ))}
          </ul>
        ) : null}
        <ActionBar
          seated={Boolean(me?.seatId)}
          showGrill={isHanpander}
          onSitNearest={sitNearby}
          onLeaveSeat={leaveSeat}
          onToast={() => sendAction("toast")}
          onGrill={() => sendAction("grill")}
          onOpenMenu={() => setMenuOpen(true)}
        />
      </div>

      {error ? (
        <div className="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-xl bg-rose-900/90 px-4 py-2 text-sm text-rose-50">
          {error}
        </div>
      ) : null}

      <MenuModal
        open={menuOpen}
        brand={channelDef.brand}
        title={`${channelDef.name} 메뉴`}
        items={menuItems}
        onClose={() => setMenuOpen(false)}
        onOrder={placeOrder}
      />
    </main>
  );
}
