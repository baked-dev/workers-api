import { build as esbuild, BuildOptions, Plugin } from "esbuild";
import { join } from "path";
import entry from "./entry.mjs";

export default async (options: BuildOptions = {}) => {
  const contents = await entry();
  await esbuild({
    bundle: true,
    format: "esm",
    mainFields: ["browser", "module", "main"],
    platform: "neutral",
    target: "es2020",
    stdin: {
      resolveDir: process.cwd(),
      contents,
      loader: "ts",
    },
    outfile: join(process.cwd(), "./dist/worker.mjs"),
    sourcemap: false,
    charset: "utf8",
    ...options,
  });
};
