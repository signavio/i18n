import path from 'path';
import fs from 'fs';
var I18NRC_FILENAME = '.i18nrc';
var existsCache = {};
var configCache = {};

function exists(fileName) {
  if (existsCache[fileName] == null) {
    existsCache[fileName] = fs.existsSync(fileName);
  }

  return existsCache[fileName];
}

function findConfig(loc) {
  if (!loc) {
    return null;
  }

  var location = loc;

  if (!path.isAbsolute(location)) {
    location = path.join(process.cwd(), location);
  }

  do {
    var configLoc = path.join(location, I18NRC_FILENAME);

    if (exists(configLoc)) {
      return configLoc;
    }
  } while (location !== (location = path.dirname(location)));

  return null;
}

export default function getConfig() {
  var filename = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '.';
  var loc = findConfig(filename);

  if (!loc) {
    throw new Error('Could not find .i18nrc');
  }

  if (configCache[loc]) {
    return configCache[loc];
  }

  var content = fs.readFileSync(loc, 'utf8');

  try {
    configCache[loc] = JSON.parse(content);
  } catch (err) {
    err.message = "".concat(loc, ": Error while parsing JSON - ").concat(err.message);
    throw err;
  }

  return configCache[loc];
}