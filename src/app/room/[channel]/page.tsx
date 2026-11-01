"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActionBar } from "@/components/ui/ActionBar";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { MenuModal } from "@/components/ui/MenuModal";
import { MobileControls } from "@/components/ui/MobileControls";
import { VoteModal } from "@/components/ui/VoteModal";
import { getChannel, isChannelId } from "@/lib/channels";
import { BOSS_LINES } from "@/lib/dialogue";
import { HANPANDER_LAYOUT, LOBSTER_SEAT_ID } from "@/lib/hanpanderSeats";
import { getMenuItem, menuForChannel, type MenuId } from "@/lib/menu";
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
  const [error, setError] = useState<string | null>(null);
  const [voteOpen, setVoteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bossLine, setBossLine] = useState(BOSS_LINES[0]);

  const me = useMemo(
    () => room.players.find((player) => player.id === selfId) ?? null,
    [room.players, selfId],
  );

  const myOrders = useMemo(
    () => room.orders.filter((order) => order.playerId === selfId).slice(-4).reverse(),
    [room.orders, selfId],
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
    };
    const onHitFx = (event: HitEvent) => {
      setHitNotes((prev) => [event, ...prev].slice(0, 4));
    };
    const onChat = (message: ChatMessage) => {
      setChats((prev) => [...prev, message].slice(-40));
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBossLine((current) => {
        const idx = BOSS_LINES.indexOf(current);
        return BOSS_LINES[(idx + 1) % BOSS_LINES.length] ?? BOSS_LINES[0];
      });
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

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

  function sendAction(type: "toast" | "pour" | "snack" | "grill") {
    getSocket().emit("action", { type });
  }

  function sendChat(text: string) {
    getSocket().emit("chat", { text });
  }

  function placeOrder(menuId: MenuId) {
    getSocket().emit("order", { menuId });
    setMenuOpen(false);
  }

  function castVote(choice: "yes" | "no") {
    getSocket().emit("vote", { choice });
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
      <div className="absolute inset-0 z-0">
        {isHanpander ? (
          <HanpanderHall
            players={room.players}
            selfId={selfId}
            orders={room.orders}
            delivery={room.delivery}
            onSeatClick={claimSeat}
            onHitPlayer={hitPlayer}
            onHitLobster={hitLobster}
          />
        ) : (
          <DinnerHall
            players={room.players}
            selfId={selfId}
            orders={room.orders}
            delivery={room.delivery}
            onSeatClick={claimSeat}
            onHitPlayer={hitPlayer}
          />
        )}
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4">
        <div
          className={`rounded-2xl border px-4 py-3 backdrop-blur ${
            isHanpander
              ? "border-emerald-900/40 bg-[rgba(8,18,14,0.78)]"
              : "border-amber-900/40 bg-[rgba(18,12,8,0.78)]"
          }`}
        >
          <p
            className={`text-xs tracking-[0.18em] ${
              isHanpander ? "text-emerald-300/90" : "text-fuchsia-300/90"
            }`}
          >
            {channelDef.brand}
          </p>
          <h1 className="text-lg font-semibold text-amber-50">{channelDef.name}</h1>
          <p className="mt-1 max-w-sm text-xs leading-5 text-amber-100/70">{room.stageMessage}</p>
          <p className="mt-2 text-[11px] text-amber-200/70">
            이동: WASD / 바닥 클릭 · 앉기: 의자 · 때리기: 캐릭터 클릭 · 채팅창으로 대화
          </p>
          {myOrders.length > 0 ? (
            <ul className="mt-2 space-y-1 text-[11px] text-amber-100/75">
              {myOrders.map((order) => (
                <li key={order.id}>
                  {getMenuItem(order.menuId).emoji} {getMenuItem(order.menuId).name}
                  {" · "}
                  {order.status === "queued"
                    ? "대기"
                    : order.status === "delivering"
                      ? "배달 중"
                      : "도착"}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="space-y-2 text-right">
          <div className="rounded-2xl border border-amber-900/40 bg-[rgba(18,12,8,0.78)] px-4 py-3 backdrop-blur">
            <p className="text-xs text-amber-200/70">접속 {room.players.length}명</p>
            <p className="text-sm font-medium text-amber-50">{me?.name ?? "..."}</p>
            <ul className="mt-2 space-y-1 text-left text-[11px] text-amber-100/70">
              {room.players.map((player) => (
                <li key={player.id}>
                  {player.id === selfId ? "★ " : "· "}
                  {player.gender === "female" ? "♀ " : "♂ "}
                  {player.name}
                  {player.seatId ? " (착석)" : " (대기)"}
                </li>
              ))}
              {isHanpander ? <li>· ♂ 랍스타 (NPC)</li> : null}
            </ul>
            <button
              type="button"
              className="pointer-events-auto mt-3 rounded-lg border border-amber-800/50 px-2 py-1 text-[11px] text-amber-100/80"
              onClick={() => router.push("/")}
            >
              채널 나가기
            </button>
          </div>
          {!isHanpander ? (
            <div className="rounded-2xl border border-rose-900/40 bg-[rgba(40,10,10,0.78)] px-4 py-2 text-left text-[11px] text-rose-50 backdrop-blur">
              <p className="font-semibold text-rose-200">팀장님</p>
              <p className="mt-1 leading-4 text-rose-50/85">{bossLine}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-900/40 bg-[rgba(40,10,10,0.78)] px-4 py-2 text-left text-[11px] text-red-50 backdrop-blur">
              <p className="font-semibold text-red-200">랍스타</p>
              <p className="mt-1 leading-4 text-red-50/85">
                여기 고기 한판 더 시켜야지. 환풍기 소리 들리냐?
              </p>
            </div>
          )}
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
                <span className="font-semibold text-amber-200">{hit.targetName}</span> 강타!
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
          onPour={() => sendAction("pour")}
          onSnack={() => sendAction("snack")}
          onGrill={() => sendAction("grill")}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenVote={() => setVoteOpen(true)}
        />
      </div>

      {error ? (
        <div className="absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-xl bg-rose-900/90 px-4 py-2 text-sm text-rose-50">
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
      <VoteModal
        open={voteOpen}
        vote={room.vote}
        onClose={() => setVoteOpen(false)}
        onVote={castVote}
      />
    </main>
  );
}
