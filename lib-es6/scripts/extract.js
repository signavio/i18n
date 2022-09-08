import _toConsumableArray from "@babel/runtime/helpers/toConsumableArray";
import _defineProperty from "@babel/runtime/helpers/defineProperty";
import _objectWithoutProperties from "@babel/runtime/helpers/objectWithoutProperties";
var _excluded = ["babel"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

import glob from 'glob';
import ProgressBar from 'progress';
import { transformFileSync } from '@babel/core';
import fs from 'fs';
import babelGettextExtractor from './babel-gettext-extractor';
import getConfig from './config';

if (process.argv.length < 3) {
  throw new Error("Invalid arguments, expected: 'node i18n/scripts/extract.js \"source_file_pattern\"', got: ".concat(process.argv.join(' ')));
} // glob sync returns an array of filenames matching the pattern


var files = glob.sync(process.argv[2]);
var outputfileName = process.argv[3];
var replacementsJSONPath = process.argv[4];
var replacements;

if (replacementsJSONPath) {
  try {
    replacements = JSON.parse(fs.readFileSync(replacementsJSONPath, 'utf8'));
  } catch (err) {
    process.exit(1);
  }
}

var progressBar = new ProgressBar(' extracting [:bar] :percent :fileName', {
  total: files.length,
  width: 10
});
files.forEach(function (fileName) {
  // eslint-disable-next-line no-console
  progressBar.tick(1, {
    fileName: fileName
  });

  var _getConfig = getConfig(fileName),
      _getConfig$babel = _getConfig.babel,
      babel = _getConfig$babel === void 0 ? {} : _getConfig$babel,
      config = _objectWithoutProperties(_getConfig, _excluded);

  var _babel$plugins = babel.plugins,
      plugins = _babel$plugins === void 0 ? [] : _babel$plugins;
  transformFileSync(fileName, _objectSpread(_objectSpread({}, babel), {}, {
    plugins: [].concat(_toConsumableArray(plugins), [[babelGettextExtractor, _objectSpread(_objectSpread({}, config), {}, {
      fileName: config.fileName || outputfileName,
      replacements: replacements
    })]])
  }));
});