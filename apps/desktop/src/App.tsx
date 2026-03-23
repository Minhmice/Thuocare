import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@thuocare/ui-web";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 text-zinc-900">
      <h1 className="text-2xl font-semibold">Thuocare · Tauri + shared UI</h1>
      <form
        className="flex w-full max-w-sm flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void greet();
        }}
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <Button type="submit">Greet</Button>
      </form>
      {greetMsg ? <p className="text-sm text-zinc-600">{greetMsg}</p> : null}
    </main>
  );
}

export default App;
