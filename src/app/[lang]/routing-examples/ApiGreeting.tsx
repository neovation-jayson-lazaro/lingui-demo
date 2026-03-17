"use client";

import { useState } from "react";
import { Trans } from "@lingui/react/macro";
import { useLocalePathname } from "@/hooks/locale-hooks";

type GreetingResponse = {
  locale: string;
  message: string;
};

export function ApiGreeting() {
  const { locale } = useLocalePathname();
  const [data, setData] = useState<GreetingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchGreeting() {
    setLoading(true);
    try {
      const res = await fetch(`/api/greeting?locale=${locale}`);
      const json: GreetingResponse = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={fetchGreeting}
        disabled={loading}
        className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        {loading ? <Trans>Loading...</Trans> : <Trans>Fetch</Trans>}
      </button>
      {data && (
        <pre className="w-full max-w-md overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 p-4 text-left text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </>
  );
}
