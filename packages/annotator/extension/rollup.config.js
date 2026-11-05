import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/background/index.ts',
  output: {
    file: 'build/extension.bundle.js',
    format: 'iife',

    // A source map beside the bundle, which the bundle doesn't name, for tools/third-party.js to
    // read the bundled packages from.
    sourcemap: 'hidden',

    // Global variable used for entry point exports. This is not actually used,
    // but it suppresses a warning from Rollup about accessing exports of an
    // IIFE bundle.
    name: 'hypothesis',
  },
  plugins: [
    babel({
      babelHelpers: 'bundled',
      // Dependencies are in the workspace's store (../../../node_modules/.pnpm), not ./node_modules.
      exclude: '**/node_modules/**',
      extensions: ['.js', '.ts'],
    }),
    nodeResolve({ extensions: ['.js', '.ts'] }),
    commonjs(),
    json(),
  ],
};
