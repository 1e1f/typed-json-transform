// rollup.config.js
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
// import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default [{
  input: [ "src/index.ts", "src/fixtures.ts" ],
  output: {
    dir: "dist/esm",
    format: "esm",
    sourcemap: true,
    entryFileNames: ({ name }) => `${name}.mjs`
  },
  plugins: [
    resolve(),
    json(),
    typescript({outDir:"dist/esm"}),
  ],
},{
  input: [ "src/index.ts", "src/fixtures.ts" ],
  output: {
    dir: "dist/common",
    format: "cjs",
    sourcemap: true,
    entryFileNames: ({ name }) => `${name}.cjs`
  },
  plugins: [
    resolve(),
    json(),
    typescript({outDir:"dist/common"}),
  ],
}];
