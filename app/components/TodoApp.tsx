"use client";

import {
  useId,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  addChecklistItem,
  addTodo,
  deleteChecklistItem,
  deleteTodo,
  getServerSnapshot,
  getSnapshot,
  isPlannedForToday,
  setPlannedForToday,
  subscribe,
  toggleChecklistItem,
  toggleTodo,
  updateMemo,
  type ChecklistItem,
  type Todo,
} from "../lib/todoStore";
import {
  getTodayServerSnapshot,
  getTodaySnapshot,
  subscribeToday,
} from "../lib/today";

const MAX_LENGTH = 100;
const CHECKLIST_MAX_LENGTH = 100;
const MEMO_MAX_LENGTH = 1000;
// http(s) で始まる部分だけをリンクにする（日本語の文字や空白で区切る）
const URL_PATTERN = /(https?:\/\/[\w\-.~:/?#[\]@!$&'()*+,;=%]+)/;

type View = "all" | "today";

export default function TodoApp() {
  const todos = useSyncExternalStore<Todo[] | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const today = useSyncExternalStore<string | null>(
    subscribeToday,
    getTodaySnapshot,
    getTodayServerSnapshot,
  );
  const [view, setView] = useState<View>("all");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  const trimmed = text.trim();
  const loaded = todos !== null && today !== null;
  const todayTodos = loaded
    ? todos.filter((todo) => isPlannedForToday(todo, today))
    : [];
  const visibleTodos = !loaded ? [] : view === "today" ? todayTodos : todos;
  const remaining = visibleTodos.filter((t) => !t.completed).length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed) {
      setError("タスクの内容を入力してください。");
      return;
    }
    addTodo(trimmed);
    setText("");
    setError("");
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6"
      >
        <label htmlFor={inputId} className="block text-lg font-bold">
          新しいタスク
        </label>
        <p id={hintId} className="mt-1 text-base text-slate-600">
          やることを入力して「追加」を押してください（{MAX_LENGTH}文字まで）。
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id={inputId}
            type="text"
            value={text}
            maxLength={MAX_LENGTH}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError("");
            }}
            placeholder="例：牛乳を買う"
            autoComplete="off"
            enterKeyHint="done"
            aria-describedby={error ? `${hintId} ${errorId}` : hintId}
            aria-invalid={error ? true : undefined}
            className={`min-h-12 w-full flex-1 rounded-xl border-2 bg-white px-4 text-lg outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${
              error ? "border-red-500" : "border-slate-300"
            }`}
          />
          <button
            type="submit"
            aria-disabled={!trimmed}
            className={`min-h-12 rounded-xl px-6 text-lg font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
              trimmed
                ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                : "cursor-not-allowed bg-slate-300 text-slate-600"
            }`}
          >
            追加
          </button>
        </div>
        <p
          id={errorId}
          role="alert"
          className="mt-2 min-h-6 text-base font-medium text-red-600"
        >
          {error}
        </p>
      </form>

      <section aria-labelledby="todo-list-heading">
        <div className="mb-3 flex items-baseline justify-between gap-2 px-1">
          <h2 id="todo-list-heading" className="text-xl font-bold">
            タスク一覧
          </h2>
          {visibleTodos.length > 0 && (
            <p className="text-base text-slate-600" aria-live="polite">
              残り <span className="font-bold text-slate-900">{remaining}</span>{" "}
              件 / 全 {visibleTodos.length} 件
            </p>
          )}
        </div>

        {loaded && todos.length > 0 && (
          <div
            role="group"
            aria-label="表示するタスク"
            className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-200 p-1"
          >
            <ViewButton
              selected={view === "all"}
              onSelect={() => setView("all")}
            >
              すべて（{todos.length}）
            </ViewButton>
            <ViewButton
              selected={view === "today"}
              onSelect={() => setView("today")}
            >
              ☀ 今日やること（{todayTodos.length}）
            </ViewButton>
          </div>
        )}

        {!loaded ? (
          <p className="rounded-2xl bg-white p-6 text-center text-lg text-slate-500 ring-1 ring-slate-200">
            読み込み中…
          </p>
        ) : todos.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-lg font-bold">タスクはまだありません</p>
            <p className="mt-2 text-base text-slate-600">
              上の入力欄にやることを書いて「追加」を押すと、ここに表示されます。
            </p>
          </div>
        ) : visibleTodos.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-white p-8 text-center">
            <p className="text-lg font-bold">今日やるタスクはまだありません</p>
            <p className="mt-2 text-base text-slate-600">
              「すべて」の一覧で、各タスクの「今日やる」を押すと、ここに表示されます。
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visibleTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                plannedForToday={isPlannedForToday(todo, today)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ViewButton({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`min-h-11 rounded-lg px-2 text-base font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
        selected
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function TodoItem({
  todo,
  plannedForToday,
}: {
  todo: Todo;
  plannedForToday: boolean;
}) {
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const checklistId = useId();
  const memoId = useId();
  const total = todo.checklist.length;
  const done = todo.checklist.filter((item) => item.completed).length;

  return (
    <li
      className={`flex flex-col gap-2 rounded-2xl p-3 ring-1 transition sm:p-4 ${
        todo.completed
          ? "bg-green-50 ring-green-200"
          : "bg-white shadow-sm ring-slate-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => toggleTodo(todo.id)}
          aria-pressed={todo.completed}
          aria-label={
            todo.completed
              ? `「${todo.text}」を未完了に戻す`
              : `「${todo.text}」を完了にする`
          }
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-1 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
        >
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-lg font-bold ${
              todo.completed
                ? "border-green-600 bg-green-600 text-white"
                : "border-slate-400 bg-white text-transparent"
            }`}
          >
            ✓
          </span>
          <span
            className={`break-words text-lg [overflow-wrap:anywhere] ${
              todo.completed ? "text-slate-500 line-through" : "text-slate-900"
            }`}
          >
            {todo.text}
          </span>
        </button>

        <button
          type="button"
          onClick={() => deleteTodo(todo.id)}
          aria-label={`「${todo.text}」を削除`}
          className="flex min-h-12 shrink-0 items-center gap-1 rounded-xl border-2 border-red-300 bg-white px-3 text-base font-bold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 active:bg-red-100"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
          </svg>
          削除
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        <PanelToggle
          open={checklistOpen}
          onToggle={() => setChecklistOpen((open) => !open)}
          controls={checklistId}
          label="チェック項目"
        >
          {total > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-sm font-bold ${
                done === total
                  ? "bg-green-100 text-green-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {done}/{total}
              <span className="sr-only"> 完了</span>
            </span>
          )}
        </PanelToggle>
        <PanelToggle
          open={memoOpen}
          onToggle={() => setMemoOpen((open) => !open)}
          controls={memoId}
          label="メモ"
        >
          {todo.memo && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-sm font-bold text-amber-800">
              あり
            </span>
          )}
        </PanelToggle>
        <button
          type="button"
          onClick={() => setPlannedForToday(todo.id, !plannedForToday)}
          aria-pressed={plannedForToday}
          aria-label={
            plannedForToday
              ? `「${todo.text}」を今日やるから外す`
              : `「${todo.text}」を今日やる`
          }
          className={`ml-auto flex min-h-11 items-center gap-1 rounded-xl border-2 px-3 text-base font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${
            plannedForToday
              ? "border-amber-500 bg-amber-100 text-amber-900 hover:bg-amber-200"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span aria-hidden="true">☀</span>
          {plannedForToday ? "今日やる ✓" : "今日やる"}
        </button>
      </div>

      {checklistOpen && <Checklist id={checklistId} todo={todo} />}
      {memoOpen && <Memo id={memoId} todo={todo} />}
    </li>
  );
}

function PanelToggle({
  open,
  onToggle,
  controls,
  label,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  controls: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-base font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
    >
      <span
        aria-hidden="true"
        className={`inline-block transition ${open ? "rotate-90" : ""}`}
      >
        ▶
      </span>
      {label}
      {children}
    </button>
  );
}

function Checklist({ id, todo }: { id: string; todo: Todo }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const inputId = useId();
  const errorId = useId();
  const trimmed = text.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed) {
      setError("チェック項目の内容を入力してください。");
      return;
    }
    addChecklistItem(todo.id, trimmed);
    setText("");
    setError("");
  }

  return (
    <div
      id={id}
      className="ml-2 border-l-2 border-slate-200 pl-3 sm:ml-4 sm:pl-4"
    >
      {todo.checklist.length === 0 ? (
        <p className="py-1 text-base text-slate-600">
          作業の手順を項目として追加できます。
        </p>
      ) : (
        <ul
          className="flex flex-col gap-1"
          aria-label={`「${todo.text}」のチェック項目`}
        >
          {todo.checklist.map((item) => (
            <ChecklistRow key={item.id} todoId={todo.id} item={item} />
          ))}
        </ul>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-2 flex flex-col gap-2 sm:flex-row"
      >
        <label htmlFor={inputId} className="sr-only">
          「{todo.text}」にチェック項目を追加
        </label>
        <input
          id={inputId}
          type="text"
          value={text}
          maxLength={CHECKLIST_MAX_LENGTH}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError("");
          }}
          placeholder="例：材料をそろえる"
          autoComplete="off"
          enterKeyHint="done"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className={`min-h-11 w-full flex-1 rounded-xl border-2 bg-white px-3 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${
            error ? "border-red-500" : "border-slate-300"
          }`}
        />
        <button
          type="submit"
          aria-disabled={!trimmed}
          className={`min-h-11 rounded-xl px-4 text-base font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
            trimmed
              ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
              : "cursor-not-allowed bg-slate-300 text-slate-600"
          }`}
        >
          項目を追加
        </button>
      </form>
      <p
        id={errorId}
        role="alert"
        className="mt-1 min-h-5 text-sm font-medium text-red-600"
      >
        {error}
      </p>
    </div>
  );
}

function ChecklistRow({
  todoId,
  item,
}: {
  todoId: string;
  item: ChecklistItem;
}) {
  return (
    <li className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => toggleChecklistItem(todoId, item.id)}
        aria-pressed={item.completed}
        aria-label={
          item.completed
            ? `「${item.text}」を未完了に戻す`
            : `「${item.text}」を完了にする`
        }
        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-1 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
      >
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold ${
            item.completed
              ? "border-green-600 bg-green-600 text-white"
              : "border-slate-400 bg-white text-transparent"
          }`}
        >
          ✓
        </span>
        <span
          className={`break-words text-base [overflow-wrap:anywhere] ${
            item.completed ? "text-slate-500 line-through" : "text-slate-900"
          }`}
        >
          {item.text}
        </span>
      </button>
      <button
        type="button"
        onClick={() => deleteChecklistItem(todoId, item.id)}
        aria-label={`チェック項目「${item.text}」を削除`}
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 active:bg-red-100"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </li>
  );
}

function Memo({ id, todo }: { id: string; todo: Todo }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaId = useId();
  const countId = useId();

  function startEditing() {
    setDraft(todo.memo);
    setEditing(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateMemo(todo.id, draft.trim());
    setEditing(false);
  }

  return (
    <div
      id={id}
      className="ml-2 border-l-2 border-amber-200 pl-3 sm:ml-4 sm:pl-4"
    >
      {editing ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor={textareaId} className="sr-only">
            「{todo.text}」のメモ
          </label>
          <textarea
            id={textareaId}
            value={draft}
            maxLength={MEMO_MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            autoFocus
            placeholder="例：参考 https://example.com"
            aria-describedby={countId}
            className="w-full resize-y rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
          <p id={countId} className="text-right text-sm text-slate-600">
            {draft.length}/{MEMO_MAX_LENGTH}文字
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-blue-600 px-4 text-base font-bold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 active:bg-blue-800"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-base font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 active:bg-slate-100"
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-start gap-2">
          {todo.memo ? (
            <p className="whitespace-pre-wrap break-words text-base text-slate-900 [overflow-wrap:anywhere]">
              <MemoText text={todo.memo} />
            </p>
          ) : (
            <p className="py-1 text-base text-slate-600">
              補足情報や参考URLを残しておけます。
            </p>
          )}
          <button
            type="button"
            onClick={startEditing}
            aria-label={
              todo.memo
                ? `「${todo.text}」のメモを編集`
                : `「${todo.text}」のメモを書く`
            }
            className="min-h-11 rounded-xl border-2 border-blue-300 bg-white px-4 text-base font-bold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 active:bg-blue-100"
          >
            {todo.memo ? "編集" : "メモを書く"}
          </button>
        </div>
      )}
    </div>
  );
}

function MemoText({ text }: { text: string }) {
  // split にキャプチャ付きの正規表現を渡すと、奇数番目が URL になる
  return text.split(URL_PATTERN).map((part, index) =>
    index % 2 === 1 ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}
