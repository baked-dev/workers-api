function transformRecord<T = unknown, R = unknown>(
  record: Record<string, T>,
  transform: (value: T) => R
): Record<string, R> {
  const copy: Record<string, any> = { ...record };
  Object.entries(copy).forEach(([key, value]) => {
    copy[key] = transform(value);
  });
  return copy as Record<string, R>;
}

type Awaitable<T> = Promise<T> | T;

export interface CustomRouterBeforeMatch {
  (req: Request, ctx: ExecutionContext): Awaitable<string | Response>;
}

export interface CustomRouterAfterHandler {
  (req: Request, res: Response, ctx: ExecutionContext): Awaitable<Response>;
}

export interface CustomRouterNotFound {
  (req: Request): Awaitable<Response>;
}

export interface CustomRouter {
  beforeMatch: CustomRouterBeforeMatch;
  afterHandler: CustomRouterAfterHandler;
  notFound: CustomRouterNotFound;
}

const defaultBeforeMatch: CustomRouterBeforeMatch = (req) => req.url;
const defaultAfterHandler: CustomRouterAfterHandler = (_, res) => res;
const defaultNotFound: CustomRouterNotFound = () =>
  new Response("Not found", { status: 404 });

const makeRouter = (
  handlers: [string, Promise<ExportedHandlerFetchHandler>][],
  customRouter: Promise<CustomRouter>
): ExportedHandlerFetchHandler => {
  return async (req, env, ctx) => {
    const {
      beforeMatch = defaultBeforeMatch,
      afterHandler = defaultAfterHandler,
      notFound = defaultNotFound,
    } = (await customRouter) || {};
    const url = await beforeMatch(req, ctx);
    if (url instanceof Response) return afterHandler(req, url, ctx);
    for (const [match, handler] of handlers) {
      const result = new URLPattern(match, new URL(url).origin).exec(url);
      if (result) {
        (req as any).params = transformRecord(result.pathname.groups, (value) =>
          value.split("/")
        );
        return afterHandler(req, await (await handler)(req, env, ctx), ctx);
      }
    }
    return notFound(req);
  };
};

export default makeRouter;
