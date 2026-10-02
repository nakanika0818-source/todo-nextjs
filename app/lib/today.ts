// 日本時間（UTC+9、夏時間なし）の「今日」を "YYYY-MM-DD" で扱う
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getTodayKey(now = Date.now()): string {
  return new Date(now + JST_OFFSET_MS).toISOString().slice(0, 10);
}

function msUntilNextJstMidnight(now = Date.now()): number {
  return DAY_MS - ((now + JST_OFFSET_MS) % DAY_MS);
}

// ページを開いたまま日付が変わったときに知らせる
export function subscribeToday(listener: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    // 境目ちょうどで発火して前日扱いにならないよう少し余裕を持たせる
    timer = setTimeout(() => {
      listener();
      schedule();
    }, msUntilNextJstMidnight() + 1000);
  };
  // スリープ中はタイマーが遅れるので、画面に戻ったときにも確認する
  const onVisible = () => {
    if (document.visibilityState === "visible") listener();
  };
  schedule();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", listener);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", listener);
  };
}

export function getTodaySnapshot(): string {
  return getTodayKey();
}

// サーバー描画時はタスク一覧と同じく読み込み中として扱う
export function getTodayServerSnapshot(): string | null {
  return null;
}
