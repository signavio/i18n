import path from 'path'
import fs from 'fs'
import isAbsolute from 'path-is-absolute'
import pathExists from 'path-exists'

const I18NRC_FILENAME = '.i18nrc'


let existsCache = {}
let configCache = {}

function exists(filename) {
  let cached = existsCache[filename];
  if (cached == null) {
    return existsCache[filename] = pathExists.sync(filename);
  } else {
    return cached;
  }
}

function findConfig(loc) {
  if (!loc) return;

  if (!isAbsolute(loc)) {
    loc = path.join(process.cwd(), loc);
  }

  while (loc !== (loc = path.dirname(loc))) {
    let configLoc = path.join(loc, I18NRC_FILENAME);
    if (exists(configLoc)) {
      return configLoc
    }
  }

  throw new Error('Could not find .i18nrc')
}

export default function getConfig(filename = '.') {
  const loc = findConfig(filename)
  if(configCache[loc]) {
    return configCache[loc]
  }

  let content = fs.readFileSync(loc, "utf8")
  try {
    configCache[loc] = JSON.parse(content);
  } catch (err) {
    err.message = `${loc}: Error while parsing JSON - ${err.message}`;
    throw err;
  }

  return configCache[loc]
}
