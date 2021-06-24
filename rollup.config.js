import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';

import scss from './rollup/rollup-plugin-scss';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
        plugins: [ terser(), ],
      },
      {
        name: "DomTreeAnnotator",
        file: pkg.browser,
        format: 'iife',
        sourcemap: true,
        plugins: [ terser(), ],
      },
    ],
    plugins: [
      typescript({tsconfig: './tsconfig.json'}),
      resolve(),
      commonjs(),
    ],
    watch: {
      include: 'src/**/*',
    },
  },
  {
    input: './lib/dts/index.d.ts',
    output: {
      file: './lib/index.d.ts',
      format: 'es',
    },
    plugins: [ dts(), ],
    watch: {
      include: 'lib/dts/**/*',
    },
  },
  {
    input: 'scss/dom-tree-annotator.scss',
    plugins: [
      scss(),
    ],
    output: {
      file: 'lib/dom-tree-annotator.min.css',
      sourcemap: true,
    },
  },
];

