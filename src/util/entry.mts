import glob from "./glob.mjs";
import routes from "./routes.mjs";

const importRouter = (customRouter: string) =>
  customRouter ? `const router = import("${customRouter}");` : "";

const destructureRouter = (customRouter: string) =>
  customRouter
    ? `
  const { 
    beforeMatch = req => req.url, 
    afterHandler = (_, res) => res, 
    notFound = () => new Response('Not found', { status: 404 }) 
  } = await router;
  const url = await beforeMatch(req, ctx);
  if (req instanceof Response) return afterHandler(
    req, 
    url,
    ctx
  );
`
    : "const url = req.url";

const matchedReturnStatement = (customRouter: string) =>
  customRouter
    ? `afterHandler(
    req, 
    await (await handler)(req, env, ctx), 
    ctx
  )`
    : "(await handler)(req, env, ctx)";

const unmatchedReturnStatement = (customRouter: string) =>
  customRouter ? "notFound(req)" : "new Response('Not found', { status: 404 })";

export default async () => {
  const [customRouter] = await glob(
    "./api/_router{.js,.ts,.mjs,.mts,.cjs,.cts}"
  );
  const orderedRoutes = await routes();
  return `
    ${importRouter(customRouter)};
    const handlers: [string, Promise<ExportedHandlerFetchHandler>][] = [${orderedRoutes}];

    const transformRecord = <T = unknown, R = unknown>(
      record: Record<string, T>,
      transform: (value: T) => R
    ): Record<string, R> => {
      const copy: Record<string, any> = { ...record };
      Object.entries(copy).forEach(([key, value]) => {
        copy[key] = transform(value);
      });
      return copy as Record<string, R>;
    };

    const fetchHandler: ExportedHandlerFetchHandler = async (req, env, ctx) => {
      ${destructureRouter(customRouter)}
      for (const [match, handler] of handlers) {
        const result = new URLPattern(match, new URL(url).origin).exec(url);
        if (result) {
          (req as any).params = transformRecord(result.pathname.groups, (value) =>
            value.split("/")
          );
          return ${matchedReturnStatement(customRouter)};
        }
      }
      return ${unmatchedReturnStatement(customRouter)};
    }

    export default {
      fetch: fetchHandler
    }
  `;
};
