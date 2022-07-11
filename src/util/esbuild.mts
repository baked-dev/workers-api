import { build as esbuild } from "esbuild";
import { remove } from "fs-extra";
import { join } from "path";
import entry from "./entry.mjs";

export default async (minify: boolean) => {
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
    minify,
  });
};
