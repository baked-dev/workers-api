import esbuild from "../util/esbuild.mjs";

export default () => {
  esbuild({ minify: true });
};
