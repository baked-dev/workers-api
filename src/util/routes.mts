import glob from "./glob.mjs";

const routeGlob = "./api/**/!(_router)*{.js,.ts,.mjs,.mts,.cjs,.cts}";

const isCatchAll = (segment: string) =>
  Boolean(segment.match(/^\[\.\.\..*\]$/));
const isDynamic = (segment: string) => Boolean(segment.match(/^\[.*\]$/));

const makeImport = (route: string, segments: string[]) =>
  `["${
    "/" +
    segments
      .map((segment) => {
        if (segment.match(/^\[\.\.\..*\]$/)) {
          return segment.replace(/^\[\.\.\./, ":").replace(/\]$/, "*");
        } else if (segment.match(/^\[.*\]$/)) {
          return segment.replace(/^\[/, ":").replace(/\]$/, "");
        } else return segment;
      })
      .join("/")
  }", import("${route}").then((route) => route.default)]`;

export default async () => {
  const routes = await glob(routeGlob);
  return routes
    .map((route) => {
      const [, , ...segments] = route.split("/"); // remove ./api/
      const filename = segments.pop()?.replace(/\.[m|c]?[t|j]s$/, ""); // pop last item and remove extension
      if (filename && filename !== "index") segments.push(filename); // add back to segments unless its the "index" segment
      return [segments, makeImport(route, segments)] as const;
    })
    .sort(([segmentsA], [segmentsB]) => {
      for (const idx in segmentsA) {
        const segmentA = segmentsA[idx];
        const segmentB = segmentsB[idx];
        // static > dynamic > catch-all
        if (!segmentB) return 1;
        const segments = [segmentA, segmentB];
        const [aIsCatchAll, bIsCatchAll] = segments.map(isCatchAll);
        if (aIsCatchAll && !bIsCatchAll) return 1;
        if (!aIsCatchAll && bIsCatchAll) return -1;
        const [aIsDynamic, bIsDynamic] = segments.map(isDynamic);
        if (aIsDynamic && !bIsDynamic) return 1;
        if (!aIsDynamic && bIsDynamic) return -1;
      }
      return segmentsA.length - segmentsB.length;
    })
    .map(([, importStatement]) => {
      return importStatement;
    });
};
