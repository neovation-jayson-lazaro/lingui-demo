"use client";

import { useState } from "react";
import { Trans, Select, useLingui } from "@lingui/react/macro";

export function RolePicker() {
  const [role, setRole] = useState("user");
  const { t } = useLingui();

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-lg leading-9 text-zinc-600 dark:text-zinc-400">
          <Trans>Select permission level:</Trans>
        </span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-9 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
        >
          <option value="user">{t`User`}</option>
          <option value="admin">{t`Admin`}</option>
        </select>
      </div>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        <Select
          id="permissionMessage"
          value={role}
          _user="View your courses"
          _admin="View all courses"
          other="View your courses"
        />
      </p>
    </>
  );
}
