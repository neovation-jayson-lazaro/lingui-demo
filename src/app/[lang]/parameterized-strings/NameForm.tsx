"use client";

import { useState, useCallback } from "react";
import { Trans } from "@lingui/react/macro";

const APP_NAME = "LinguiDemo";

let cachedName = "";

function usePersistedName() {
  const [name, setNameState] = useState(cachedName);

  const setName = useCallback((value: string) => {
    cachedName = value;
    setNameState(value);
  }, []);

  return [name, setName] as const;
}

export function NameForm() {
  const [input, setInput] = useState("");
  const [name, setName] = usePersistedName();
  const placeholder = name || "_____";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      setName(trimmed);
      setInput("");
    }
  };

  return (
    <>
      <section className="flex w-full flex-col items-center gap-4">
        <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
          <Trans>String with Dynamic Content</Trans>
        </h3>
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <label className="text-lg leading-9 text-zinc-600 dark:text-zinc-400">
            <Trans>Add name:</Trans>
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-9 w-48 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 shadow-sm transition-colors hover:border-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <Trans>Submit</Trans>
          </button>
        </form>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          <Trans>Hello, my name is {placeholder}</Trans>
        </p>
      </section>

      <section className="flex w-full flex-col items-center gap-4">
        <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
          <Trans>Combined ICU MessageFormat string</Trans>
        </h3>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          <Trans>
            Hello, my name is {placeholder}. I am using {APP_NAME}.
          </Trans>
        </p>
      </section>
    </>
  );
}
