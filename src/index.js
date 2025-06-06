const { Transformer } = require("@parcel/plugin");
const { transformSync } = require("@babel/core");
const prefreshBabelPlugin = require("@prefresh/babel-plugin");

module.exports = new Transformer({
  async transform({ asset, options }) {
    if (options.mode === "production") {
      return [asset];
    }

    const code = await asset.getCode();
    const filePath = asset.filePath;

    if (
      !/\.(c|m)?(t|j)sx?$/.test(filePath) ||
      filePath.includes("node_modules")
    ) {
      return [asset];
    }

    const parserPlugins = [
      "jsx",
      "classProperties",
      "classPrivateProperties",
      "classPrivateMethods",
      /\.tsx?$/.test(filePath) && "typescript",
    ].filter(Boolean);

    let result;
    try {
      result = transformSync(code, {
        plugins: [[prefreshBabelPlugin, { skipEnvCheck: true }]],
        parserOpts: {
          plugins: parserPlugins,
        },
        ast: false,
        sourceMaps: false,
        filename: filePath,
        sourceFileName: filePath,
        configFile: false,
        babelrc: false,
      });
    } catch (err) {
      console.warn(`Prefresh transform failed for ${filePath}:`, err);
      return [asset];
    }

    if (!result?.code) {
      return [asset];
    }

    const hasReg = /\$RefreshReg\$\(/.test(result.code);
    const hasSig = /\$RefreshSig\$\(/.test(result.code);

    if (!hasSig && !hasReg) {
      return [asset];
    }

    const prelude = `
import '@prefresh/core';
import { flush as flushUpdates } from '@prefresh/utils';

let prevRefreshReg;
let prevRefreshSig;

if (module.hot) {
  prevRefreshReg = self.$RefreshReg$ || (() => {});
  prevRefreshSig = self.$RefreshSig$ || (() => (type) => type);

  self.$RefreshReg$ = (type, id) => {
    self.__PREFRESH__.register(type, ${JSON.stringify(filePath)} + " " + id);
  };

  self.$RefreshSig$ = () => {
    let status = 'begin';
    let savedType;
    return (type, key, forceReset, getCustomHooks) => {
      if (!savedType) savedType = type;
      status = self.__PREFRESH__.sign(type || savedType, key, forceReset, getCustomHooks, status);
      return type;
    };
  };
}
`;

    const postlude = hasReg
      ? `
if (module.hot) {
  self.$RefreshReg$ = prevRefreshReg;
  self.$RefreshSig$ = prevRefreshSig;
  
  module.hot.accept(() => {
    try {
      flushUpdates();
    } catch (e) {
      console.error('Prefresh flush error:', e);
      // In Parcel, just reload on error
      window.location.reload();
    }
  });
}
`
      : "";

    asset.setCode(prelude + result.code + postlude);

    return [asset];
  },
});
