export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = "todo-nextjs:todos";
const EMPTY: Todo[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedTodos: Todo[] = EMPTY;

function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.text === "string" &&
    typeof v.completed === "boolean" &&
    typeof v.createdAt === "number"
  );
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): Todo[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isTodo) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function write(todos: Todo[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 保存容量超過やプライベートモードなどで失敗しても画面は動かし続ける
  }
  cachedRaw = readRaw();
  cachedTodos = todos;
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  // 別タブでの変更も反映する
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): Todo[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedTodos = parse(raw);
  }
  return cachedTodos;
}

// サーバー側では localStorage が無いため null（読み込み中）を返す
export function getServerSnapshot(): Todo[] | null {
  return null;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function addTodo(text: string) {
  const todo: Todo = {
    id: createId(),
    text,
    completed: false,
    createdAt: Date.now(),
  };
  write([...getSnapshot(), todo]);
}

export function toggleTodo(id: string) {
  write(
    getSnapshot().map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    ),
  );
}

export function deleteTodo(id: string) {
  write(getSnapshot().filter((todo) => todo.id !== id));
}
