import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'es',
      },
      {
        name: "DomAnnotator",
        file: pkg.browser,
        format: 'es',
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
];

