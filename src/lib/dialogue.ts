const TOAST_LINES = [
  "치킨은 따뜻할 때! 위하여!",
  "맥주 한 잔에 야근을 씻자. 건배!",
  "부어~ 치킨도 부어~!",
  "뼈는 남겨도 회식은 못 남겨!",
  "내일 아침은 없다고 치고 건배!",
  "칼퇴는 꿈이었고, 2차는 현실입니다!",
];

export function randomToastLine(): string {
  return TOAST_LINES[Math.floor(Math.random() * TOAST_LINES.length)] ?? TOAST_LINES[0];
}

export const BOSS_LINES = [
  "자자, 자리 비지 않게 앉아요. 치킨 식어요.",
  "건배는 크게, 뼈는 접시에.",
  "2차는 민주주의입니다. 결과는 이미 정해졌지만.",
];
