import { getTodayKey } from "./today";

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  checklist: ChecklistItem[];
  memo: string;
  // 「今日やる」に指定した日（日本時間 "YYYY-MM-DD"）。今日と一致する間だけ有効
  todayDate: string | null;
};

// 後から追加したフィールド（旧データには無い）
type AddedFields = "checklist" | "memo" | "todayDate";

const STORAGE_KEY = "todo-nextjs:todos";
const EMPTY: Todo[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedTodos: Todo[] = EMPTY;

// 必須項目だけを確認する（後から追加したフィールドが無い旧データも受け入れる）
function isTodo(value: unknown): value is Omit<Todo, AddedFields> {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.text === "string" &&
    typeof v.completed === "boolean" &&
    typeof v.createdAt === "number"
  );
}

function isChecklistItem(value: unknown): value is ChecklistItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.text === "string" &&
    typeof v.completed === "boolean"
  );
}

// 旧データには後から追加したフィールドが無いので、初期値を補う
function normalize(
  todo: Omit<Todo, AddedFields> & Partial<Record<AddedFields, unknown>>,
): Todo {
  return {
    ...todo,
    checklist: Array.isArray(todo.checklist)
      ? todo.checklist.filter(isChecklistItem)
      : [],
    memo: typeof todo.memo === "string" ? todo.memo : "",
    todayDate: typeof todo.todayDate === "string" ? todo.todayDate : null,
  };
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
    return Array.isArray(data) ? data.filter(isTodo).map(normalize) : EMPTY;
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
    checklist: [],
    memo: "",
    todayDate: null,
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

function updateTodo(id: string, update: (todo: Todo) => Todo) {
  write(getSnapshot().map((todo) => (todo.id === id ? update(todo) : todo)));
}

export function addChecklistItem(todoId: string, text: string) {
  const item: ChecklistItem = { id: createId(), text, completed: false };
  updateTodo(todoId, (todo) => ({
    ...todo,
    checklist: [...todo.checklist, item],
  }));
}

export function toggleChecklistItem(todoId: string, itemId: string) {
  updateTodo(todoId, (todo) => ({
    ...todo,
    checklist: todo.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    ),
  }));
}

export function deleteChecklistItem(todoId: string, itemId: string) {
  updateTodo(todoId, (todo) => ({
    ...todo,
    checklist: todo.checklist.filter((item) => item.id !== itemId),
  }));
}

export function updateMemo(todoId: string, memo: string) {
  updateTodo(todoId, (todo) => ({ ...todo, memo }));
}

export function isPlannedForToday(todo: Todo, today: string) {
  return todo.todayDate === today;
}

export function setPlannedForToday(todoId: string, planned: boolean) {
  updateTodo(todoId, (todo) => ({
    ...todo,
    todayDate: planned ? getTodayKey() : null,
  }));
}
