import { Log, LogLevel, Miniflare } from "miniflare";
import { Plugin } from "esbuild";
import esbuild from "../util/esbuild.mjs";

const makeFlare = async () => {
  const flare = new Miniflare({
    wranglerConfigPath: true,
    modules: true,
    log: new Log(LogLevel.INFO),
  });
  await flare.startServer();
  return flare;
};

const miniflarePlugin: Plugin = {
  name: "MiniflarePlugin",
  async setup(build) {
    let flare: Promise<Miniflare>;
    build.onEnd(async () => {
      if (!flare) flare = makeFlare();
      else await (await flare).reload();
    });
  },
};

export default async () => {
  await esbuild({ minify: false, plugins: [miniflarePlugin], watch: true });
};
