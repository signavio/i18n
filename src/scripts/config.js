// @flow
import fs from 'fs'
import path from 'path'

import invariant from 'invariant'

import type { ConfigT, MapT } from '../types'

const I18NRC_FILENAME = '.i18nrc'

const existsCache: MapT<string, boolean> = {}
const configCache: MapT<string, ConfigT> = {}

function exists(fileName: string): boolean {
  if (existsCache[fileName] == null) {
    existsCache[fileName] = fs.existsSync(fileName)
  }

  return existsCache[fileName]
}

function findConfig(loc: string) {
  if (!loc) {
    return null
  }

  let location = loc

  if (!path.isAbsolute(location)) {
    location = path.join(process.cwd(), location)
  }

  do {
    const configLoc = path.join(location, I18NRC_FILENAME)

    if (exists(configLoc)) {
      return configLoc
    }
  } while (location !== (location = path.dirname(location)))

  return null
}

export default function getConfig(filename: string = '.'): ConfigT {
  const loc = findConfig(filename)

  invariant(loc, 'Could not find .i18nrc')

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
