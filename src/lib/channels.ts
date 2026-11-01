export type ChannelId = "boor" | "hanpander";

export interface ChannelDef {
  id: ChannelId;
  roomId: string;
  name: string;
  brand: string;
  blurb: string;
  enterLabel: string;
  accent: string;
}

export const CHANNELS: ChannelDef[] = [
  {
    id: "boor",
    roomId: "boor",
    name: "부어치킨 회식홀",
    brand: "BOOR CHICKEN",
    blurb: "파닭·어니언·간장과 생맥주. 본점 회식 채널.",
    enterLabel: "부어치킨 입장",
    accent: "orange",
  },
  {
    id: "hanpander",
    roomId: "hanpander",
    name: "한판더",
    brand: "HANPAN DEO",
    blurb: "고깃집 채널. 그릴 테이블과 환풍기, NPC 랍스타가 앉아 있어요.",
    enterLabel: "한판더 입장",
    accent: "emerald",
  },
];

export function getChannel(id: string | null | undefined): ChannelDef | null {
  return CHANNELS.find((channel) => channel.id === id) ?? null;
}

export function isChannelId(value: string): value is ChannelId {
  return CHANNELS.some((channel) => channel.id === value);
}
