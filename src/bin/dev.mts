import esbuild from "../util/esbuild.mjs";
import { watch } from "chokidar";
import { Log, LogLevel, Miniflare } from "miniflare";

export default async () => {
  const flare = new Miniflare({
    wranglerConfigPath: true,
    modules: true,
    log: new Log(LogLevel.INFO),
  });

  await esbuild(false);
  await flare.startServer();

  const watcher = watch("./api");
  watcher.on("change", async () => {
    await esbuild(false);
    await flare.reload();
  });
};
