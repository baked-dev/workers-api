import glob from "./glob.mjs";
import routes from "./routes.mjs";

const routerScript = (sortedRoutes: string[], customRouter: string) => `
import makeRouter from "@baked-dev/workers-api";
const customRouter = ${
  customRouter ? `import("${customRouter}");` : `undefined`
};
const routes = [${sortedRoutes}];

export default {
  fetch: makeRouter(routes, customRouter)
}
`;

export default async () => {
  const [customRouter] = await glob(
    "./api/_router{.js,.ts,.mjs,.mts,.cjs,.cts}"
  );
  const orderedRoutes = await routes();
  return routerScript(orderedRoutes, customRouter);
};
