import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

function linguiMacroPlugin(): Plugin {
  return {
    name: "lingui-macro-transform",
    enforce: "pre",
    async transform(code, id) {
      if (!/\.[jt]sx?$/.test(id)) return null;
      if (!code.includes("@lingui/")) return null;
      if (
        !code.includes("@lingui/react/macro") &&
        !code.includes("@lingui/core/macro")
      )
        return null;

      const babel = await import("@babel/core");
      const result = await babel.transformAsync(code, {
        filename: id,
        ast: false,
        babelrc: false,
        configFile: false,
        sourceType: "module",
        plugins: [
          "@lingui/babel-plugin-lingui-macro",
          ["@babel/plugin-syntax-jsx"],
          ["@babel/plugin-syntax-typescript", { isTSX: /\.tsx$/.test(id) }],
        ],
        sourceMaps: true,
      });

      if (!result?.code) return null;
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  plugins: [linguiMacroPlugin(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    conditions: ["browser", "import", "module", "default"],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
