"use client";

type Dir = "w" | "a" | "s" | "d";

function press(key: Dir, down: boolean) {
  window.dispatchEvent(
    new KeyboardEvent(down ? "keydown" : "keyup", {
      key,
      bubbles: true,
      cancelable: true,
    }),
  );
}

export function MobileControls() {
  const btn =
    "select-none touch-none rounded-2xl border border-amber-700/50 bg-black/55 px-4 py-3 text-sm font-bold text-amber-50 active:bg-amber-700/50";

  return (
    <div className="pointer-events-auto absolute bottom-24 right-3 z-20 grid grid-cols-3 gap-1.5 md:hidden">
      <span />
      <button
        type="button"
        className={btn}
        onTouchStart={(e) => {
          e.preventDefault();
          press("w", true);
        }}
        onTouchEnd={() => press("w", false)}
        onTouchCancel={() => press("w", false)}
      >
        ↑
      </button>
      <span />
      <button
        type="button"
        className={btn}
        onTouchStart={(e) => {
          e.preventDefault();
          press("a", true);
        }}
        onTouchEnd={() => press("a", false)}
        onTouchCancel={() => press("a", false)}
      >
        ←
      </button>
      <button
        type="button"
        className={btn}
        onTouchStart={(e) => {
          e.preventDefault();
          press("s", true);
        }}
        onTouchEnd={() => press("s", false)}
        onTouchCancel={() => press("s", false)}
      >
        ↓
      </button>
      <button
        type="button"
        className={btn}
        onTouchStart={(e) => {
          e.preventDefault();
          press("d", true);
        }}
        onTouchEnd={() => press("d", false)}
        onTouchCancel={() => press("d", false)}
      >
        →
      </button>
    </div>
  );
}
