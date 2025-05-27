import { defineConfig } from "bunup";
import { report } from "bunup/plugins";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["cjs"],
  outputExtension: () => ({
    js: ".js",
  }),
  outDir: ".",
  clean: false,
  dts: false,
  plugins: [report()],
  noExternal: ["@octokit/core"],
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
  ],
});
