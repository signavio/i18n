"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _glob = _interopRequireDefault(require("glob"));

var _progress = _interopRequireDefault(require("progress"));

var _core = require("@babel/core");

var _fs = _interopRequireDefault(require("fs"));

var _babelGettextExtractor = _interopRequireDefault(require("./babel-gettext-extractor"));

var _config = _interopRequireDefault(require("./config"));

var _excluded = ["babel"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

if (process.argv.length < 3) {
  throw new Error("Invalid arguments, expected: 'node i18n/scripts/extract.js \"source_file_pattern\"', got: ".concat(process.argv.join(' ')));
} // glob sync returns an array of filenames matching the pattern


var files = _glob["default"].sync(process.argv[2]);

var outputfileName = process.argv[3];
var replacementsJSONPath = process.argv[4];
var replacements;

if (replacementsJSONPath) {
  try {
    replacements = JSON.parse(_fs["default"].readFileSync(replacementsJSONPath, 'utf8'));
  } catch (err) {
    process.exit(1);
  }
}

var progressBar = new _progress["default"](' extracting [:bar] :percent :fileName', {
  total: files.length,
  width: 10
});
files.forEach(function (fileName) {
  // eslint-disable-next-line no-console
  progressBar.tick(1, {
    fileName: fileName
  });

  var _getConfig = (0, _config["default"])(fileName),
      _getConfig$babel = _getConfig.babel,
      babel = _getConfig$babel === void 0 ? {} : _getConfig$babel,
      config = (0, _objectWithoutProperties2["default"])(_getConfig, _excluded);

  var _babel$plugins = babel.plugins,
      plugins = _babel$plugins === void 0 ? [] : _babel$plugins;
  (0, _core.transformFileSync)(fileName, _objectSpread(_objectSpread({}, babel), {}, {
    plugins: [].concat((0, _toConsumableArray2["default"])(plugins), [[_babelGettextExtractor["default"], _objectSpread(_objectSpread({}, config), {}, {
      fileName: config.fileName || outputfileName,
      replacements: replacements
    })]])
  }));
});