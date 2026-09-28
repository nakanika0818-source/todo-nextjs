"use client";

import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  addTodo,
  deleteTodo,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  toggleTodo,
  type Todo,
} from "../lib/todoStore";

const MAX_LENGTH = 100;

export default function TodoApp() {
  const todos = useSyncExternalStore<Todo[] | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  const trimmed = text.trim();
  const remaining = todos ? todos.filter((t) => !t.completed).length : 0;

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
          {todos && todos.length > 0 && (
            <p className="text-base text-slate-600" aria-live="polite">
              残り <span className="font-bold text-slate-900">{remaining}</span>{" "}
              件 / 全 {todos.length} 件
            </p>
          )}
        </div>

        {todos === null ? (
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
        ) : (
          <ul className="flex flex-col gap-3">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl p-3 ring-1 transition sm:p-4 ${
        todo.completed
          ? "bg-green-50 ring-green-200"
          : "bg-white shadow-sm ring-slate-200"
      }`}
    >
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
    </li>
  );
}
