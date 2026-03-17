"use client";

import { useState } from "react";
import { Trans, Plural } from "@lingui/react/macro";

export function CourseCounter() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-lg leading-9 text-zinc-600 dark:text-zinc-400">
          <Trans>Select a number of courses:</Trans>
        </span>
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="h-9 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
        >
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        <Plural
          id="courseCount"
          value={count}
          _0="There are no courses"
          one="There is # course"
          other="There are # courses"
        />
      </p>
    </>
  );
}
