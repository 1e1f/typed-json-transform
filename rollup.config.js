// rollup.config.js
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: "src/index.ts",
  output: {
    dir: ".",
    name: "index.js",
    format: "umd",
  },
  plugins: [
    // babel(),
    resolve(),
    json(),
    typescript(),
  ],
};
