import path from 'path'
import fs from 'fs'
import isAbsolute from 'path-is-absolute'
import pathExists from 'path-exists'

const I18NRC_FILENAME = '.i18nrc'


const existsCache = {}
const configCache = {}

function exists(filename) {
  if (existsCache[filename] == null) {
    existsCache[filename] = pathExists.sync(filename)
  }

  return existsCache[filename]
}

function findConfig(loc) {
  if (!loc) {
    return null
  }

  let location = loc

  if (!isAbsolute(location)) {
    location = path.join(process.cwd(), location)
  }

  while (location !== (location = path.dirname(location))) {
    const configLoc = path.join(location, I18NRC_FILENAME)

    if (exists(configLoc)) {
      return configLoc
    }
  }

  return null
}

export default function getConfig(filename = '.') {
  const loc = findConfig(filename)

  if (!loc) {
    throw new Error('Could not find .i18nrc')
  }

  if (configCache[loc]) {
    return configCache[loc]
  }

  const content = fs.readFileSync(loc, 'utf8')
  try {
    configCache[loc] = JSON.parse(content)
  } catch (err) {
    err.message = `${loc}: Error while parsing JSON - ${err.message}`
    throw err
  }

  return configCache[loc]
}
