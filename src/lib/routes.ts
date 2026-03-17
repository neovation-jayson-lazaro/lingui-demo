// Manually maintained list of locale-agnostic app routes.
// Add new entries here when creating pages under src/app/[lang]/.

export const appRoutes = [
  "/",
  "/parameterized-strings",
  "/pluralization",
  "/routing-examples",
  "/routing-examples/go-home",
  "/routing-examples/slow-page",
  "/select-variation",
  "/users"
] as const;

export type AppRoute = (typeof appRoutes)[number];
