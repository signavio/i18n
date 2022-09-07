"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: !0
});
exports["default"] = getConfig;

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var I18NRC_FILENAME = '.i18nrc';
var existsCache = {};
var configCache = {};

function exists(fileName) {
  if (existsCache[fileName] == null) {
    existsCache[fileName] = _fs["default"].existsSync(fileName);
  }

  return existsCache[fileName];
}

function findConfig(loc) {
  if (!loc) {
    return null;
  }

  var location = loc;

  if (!_path["default"].isAbsolute(location)) {
    location = _path["default"].join(process.cwd(), location);
  }

  do {
    var configLoc = _path["default"].join(location, I18NRC_FILENAME);

    if (exists(configLoc)) {
      return configLoc;
    }
  } while (location !== (location = _path["default"].dirname(location)));

  return null;
}

function getConfig() {
  var filename = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '.';
  var loc = findConfig(filename);

  if (!loc) {
    throw new Error('Could not find .i18nrc');
  }

  if (configCache[loc]) {
    return configCache[loc];
  }

  var content = _fs["default"].readFileSync(loc, 'utf8');

  try {
    configCache[loc] = JSON.parse(content);
  } catch (err) {
    err.message = "".concat(loc, ": Error while parsing JSON - ").concat(err.message);
    throw err;
  }

  return configCache[loc];
}