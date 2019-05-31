// @flow
import invariant from 'invariant'

import createTranslate from './translate'
import { type LocaleMapT, type MessagesT, type TranslationsT } from './types'

type ConfigT = {
  default?: string,
  map?: LocaleMapT,
}

type LangLoaderCallbackFnT = (messages: MessagesT) => void
type GetLangLoderFnT = (locale: string) => LangLoaderCallbackFnT

let config: ?ConfigT = {}
let specifiedLocale
let getLangLoader: ?GetLangLoderFnT
let changeLocaleListeners = []

const singleton: TranslationsT = {
  messages: {},
}

/**
 * The translate function
 * @param text String - The base/singular form of the text to translate
 * @param pluralText String (optional) - The plural form of the text to translate
 * @param options Object (optional) - A mixed object of interpolations and options
 **/
const translate = createTranslate(singleton)
export default translate

/**
 * Returns a promise that resolves as soon as the messages bundle has been loaded. Loads an
 * an automatically detected locale if setLocale has not been called before.
 *
 * @param getLangLoaderFn A function that returns a resolving function for loading a specified
 * locale
 * @param configObj A hashmap with keys `default` (default locale) and `map` (mapping of locales to
 * other locales)
 **/
export function init(
  getLangLoaderFn: GetLangLoderFnT,
  configObj: ConfigT = {}
): Promise<empty> {
  getLangLoader = getLangLoaderFn
  config = configObj
  return new Promise(loadBundle)
}

/**
 * Sets the locale to use. If init has been called before, returns a promise that resolves as soon
 * as the messages bundle has been loaded
 *
 * @param locale The locale code as a string (e.g.: `en_US`, `en`, etc.)
 */
export function setLocale(newLocale: string): ?Promise<empty> {
  specifiedLocale = newLocale

  if (getLangLoader) {
    return new Promise(loadBundle)
  }

  return null
}

/**
 * Returns the currently active locale
 **/
export function locale(): string {
  const langRaw =
    specifiedLocale ||
    (window && (window.navigator.userLanguage || window.navigator.language)) ||
    'en_US'
  const langParts = langRaw.replace('-', '_').split('_')

  const language = langParts[0]
  const country = langParts.length > 1 ? `_${langParts[1].toUpperCase()}` : ''
  let currentLocale = `${language}${country}`

  currentLocale = mapLocale(currentLocale)
  if (tryToGetLangLoader(currentLocale)) {
    return currentLocale
  }

  currentLocale = mapLocale(language) // fall back to the general language
  if (tryToGetLangLoader(currentLocale)) {
    return currentLocale
  }

  invariant(
    config,
    'could not determine default local due to missing configuration.'
  )

  return mapLocale(config.default || 'en_US') // fall back to default
}

export function onChangeLocale(listener: Function) {
  changeLocaleListeners.push(listener)
}

export function offChangeLocale(listener: Function) {
  changeLocaleListeners.splice(changeLocaleListeners.indexOf(listener), 1)
}

/**
 * Reset all state as if init and setLocale have never been called. Useful for testing.
 **/
export function reset() {
  config = undefined
  specifiedLocale = undefined
  getLangLoader = undefined

  singleton.messages = {}
  changeLocaleListeners = []
}

function mapLocale(localeToMap: string) {
  if (!config || !config.map) {
    return localeToMap
  }

  return config.map[localeToMap] || localeToMap
}

function tryToGetLangLoader(forLocale: string) {
  let waitForLangChunk

  try {
    invariant(
      typeof getLangLoader === 'function',
      'Cannot load a bundle as no valid getLangLoader function has been set'
    )

    waitForLangChunk = getLangLoader(forLocale)
  } catch (e) {
    return null
  }
  return waitForLangChunk
}

function loadBundle(resolve: Function) {
  invariant(
    typeof getLangLoader === 'function',
    'Cannot load a bundle as no valid getLangLoader function has been set'
  )

  const waitForLangChunk = getLangLoader(locale())

  waitForLangChunk((messages: MessagesT) => {
    singleton.messages = messages
    changeLocaleListeners.forEach((listener: Function) => listener())
    resolve()
  })
}
