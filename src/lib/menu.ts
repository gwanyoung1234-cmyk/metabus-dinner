export type MenuId =
  | "padak"
  | "onion"
  | "ganjang"
  | "beer"
  | "samgyup"
  | "moksal"
  | "galbi"
  | "soju";

export interface MenuItem {
  id: MenuId;
  name: string;
  blurb: string;
  emoji: string;
  color: string;
  kind: "chicken" | "meat" | "drink";
}

export const MENU: MenuItem[] = [
  {
    id: "padak",
    name: "파닭치킨",
    blurb: "파 듬뿍, 고소하게",
    emoji: "🧅",
    color: "#ca8a04",
    kind: "chicken",
  },
  {
    id: "onion",
    name: "어니언치킨",
    blurb: "달콤 어니언 크런치",
    emoji: "🍗",
    color: "#d97706",
    kind: "chicken",
  },
  {
    id: "ganjang",
    name: "간장치킨",
    blurb: "짭짤달콤 간장 글레이즈",
    emoji: "🍯",
    color: "#78350f",
    kind: "chicken",
  },
  {
    id: "beer",
    name: "생맥주",
    blurb: "치킨의 단짝",
    emoji: "🍺",
    color: "#f59e0b",
    kind: "drink",
  },
  {
    id: "samgyup",
    name: "삼겹살",
    blurb: "두툼한 한판",
    emoji: "🥓",
    color: "#fca5a5",
    kind: "meat",
  },
  {
    id: "moksal",
    name: "목살",
    blurb: "불향 가득한 목살",
    emoji: "🥩",
    color: "#ef4444",
    kind: "meat",
  },
  {
    id: "galbi",
    name: "갈비",
    blurb: "달콤 양념 갈비",
    emoji: "🍖",
    color: "#991b1b",
    kind: "meat",
  },
  {
    id: "soju",
    name: "소주",
    blurb: "한잔 어때요",
    emoji: "🍶",
    color: "#e5e7eb",
    kind: "drink",
  },
];

export const BOOR_MENU_IDS: MenuId[] = ["padak", "onion", "ganjang", "beer"];
export const HANPANDER_MENU_IDS: MenuId[] = ["samgyup", "moksal", "galbi", "soju"];

export function getMenuItem(id: MenuId): MenuItem {
  return MENU.find((item) => item.id === id) ?? MENU[0];
}

export function menuForChannel(channel: "boor" | "hanpander"): MenuItem[] {
  const ids = channel === "hanpander" ? HANPANDER_MENU_IDS : BOOR_MENU_IDS;
  return ids.map((id) => getMenuItem(id));
}
