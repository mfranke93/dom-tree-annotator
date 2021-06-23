const fs = require('fs');
const path = require('path');
const sass = require('sass');

export default function scss() {
  let sourcemap = '';

  return {
    name: 'scss',
    load(id) {
      const code_map = sass.renderSync({
        file: id,
        sourceMap: 'dom-tree-annotator.min.css',
        outputStyle: 'compressed',
        omitSourceMapUrl: true,
      });

      sourcemap = code_map.map.toString();
      return { code: code_map.css.toString() };
    },
    transform(code, id) {
      return {
        code: `// ${JSON.stringify(code)}`,
        map: null,
        moduleSideEffects: 'no-treeshake',
      };
    },
    generateBundle(options, bundle, isWrite) {
      const fname = path.basename(options.file);
      const myCss = JSON.parse(bundle[fname].code.slice(3));
      let code = myCss;
      if (options.sourcemap) code += `\n/*# sourceMappingURL=${fname}.map */`;
      bundle[fname].code = code;
      bundle[fname].map = null;

      if (options.sourcemap) fs.writeFileSync(`${options.file}.map`, sourcemap);
    },
  };
};
