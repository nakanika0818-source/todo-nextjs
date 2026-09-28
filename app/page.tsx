import TodoApp from "./components/TodoApp";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <header className="mb-6 px-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          ToDoリスト
        </h1>
        <p className="mt-2 text-base text-slate-600">
          タスクはこのブラウザに保存され、再読み込みしても残ります。
        </p>
      </header>
      <TodoApp />
    </main>
  );
}
