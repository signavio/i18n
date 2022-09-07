import createTranslate from './translate';
var config = {};
var specifiedLocale;
var getLangLoader;
var changeLocaleListeners = [];
var singleton = {
  messages: {},
  replacements: null,
  interpolationPattern: '__(\\w+)__'
};
/**
 * The translate function
 * @param text String - The base/singular form of the text to translate
 * @param pluralText String (optional) - The plural form of the text to translate
 * @param options Object (optional) - A mixed object of interpolations and options
 **/

var translate = createTranslate(singleton);
export default translate;
/**
 * Returns a promise that resolves as soon as the messages bundle has been loaded. Loads an
 * an automatically detected locale if setLocale has not been called before.
 *
 * @param getLangLoaderFn A function that returns a resolving function for loading a specified
 * locale
 * @param configObj A hashmap with keys `default` (default locale) and `map` (mapping of locales to
 * other locales)
 **/

export function init(getLangLoaderFn) {
  var configObj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var replacements = arguments.length > 2 ? arguments[2] : undefined;
  getLangLoader = getLangLoaderFn;
  config = configObj;

  if (config.interpolationPattern) {
    singleton.interpolationPattern = configObj.interpolationPattern;
  }

  singleton.replacements = replacements;
  return new Promise(loadBundle);
}
/**
 * Sets the locale to use. If init has been called before, returns a promise that resolves as soon
 * as the messages bundle has been loaded
 *
 * @param locale The locale code as a string (e.g.: `en_US`, `en`, etc.)
 */

export function setLocale(newLocale) {
  specifiedLocale = newLocale;

  if (getLangLoader) {
    return new Promise(loadBundle);
  }

  return null;
}
/**
 * Returns the currently active locale
 **/

export function locale() {
  var langRaw = specifiedLocale || window && (window.navigator.userLanguage || window.navigator.language) || 'en_US';
  var langParts = langRaw.replace('-', '_').split('_');
  var language = langParts[0];
  var country = langParts.length > 1 ? "_".concat(langParts[1].toUpperCase()) : '';
  var currentLocale = "".concat(language).concat(country);
  currentLocale = mapLocale(currentLocale);

  if (tryToGetLangLoader(currentLocale)) {
    return currentLocale;
  }

  currentLocale = mapLocale(language); // fall back to the general language

  if (tryToGetLangLoader(currentLocale)) {
    return currentLocale;
  }

  return mapLocale(config["default"] || 'en_US'); // fall back to default
}
export function onChangeLocale(listener) {
  changeLocaleListeners.push(listener);
}
export function offChangeLocale(listener) {
  changeLocaleListeners.splice(changeLocaleListeners.indexOf(listener), 1);
}
/**
 * Reset all state as if init and setLocale have never been called. Useful for testing.
 **/

export function reset() {
  config = undefined;
  specifiedLocale = undefined;
  getLangLoader = undefined;
  singleton.messages = {};
  singleton.replacements = null;
  changeLocaleListeners = [];
}

function mapLocale(localeToMap) {
  if (!config || !config.map) {
    return localeToMap;
  }

  return config.map[localeToMap] || localeToMap;
}

function tryToGetLangLoader(forLocale) {
  var waitForLangChunk;

  try {
    waitForLangChunk = getLangLoader(forLocale);
  } catch (e) {
    return null;
  }

  return waitForLangChunk;
}

function loadBundle(resolve) {
  if (typeof getLangLoader != 'function') {
    throw new Error('Cannot load a bundle as no valid getLangLoader function has been set');
  }

  var waitForLangChunk = tryToGetLangLoader(locale());
  waitForLangChunk(function (messages) {
    singleton.messages = messages;
    changeLocaleListeners.forEach(function (listener) {
      return listener();
    });
    resolve();
  });
}