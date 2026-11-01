export type MenuId = "padak" | "onion" | "ganjang" | "beer";

export interface MenuItem {
  id: MenuId;
  name: string;
  blurb: string;
  emoji: string;
  color: string;
}

export const MENU: MenuItem[] = [
  {
    id: "padak",
    name: "파닭치킨",
    blurb: "파 듬뿍, 고소하게",
    emoji: "🧅",
    color: "#65a30d",
  },
  {
    id: "onion",
    name: "어니언치킨",
    blurb: "달콤 어니언 크런치",
    emoji: "🍗",
    color: "#d97706",
  },
  {
    id: "ganjang",
    name: "간장치킨",
    blurb: "짭짤달콤 간장 글레이즈",
    emoji: "🍯",
    color: "#92400e",
  },
  {
    id: "beer",
    name: "생맥주",
    blurb: "치킨의 단짝",
    emoji: "🍺",
    color: "#f59e0b",
  },
];

export function getMenuItem(id: MenuId): MenuItem {
  return MENU.find((item) => item.id === id) ?? MENU[0];
}
