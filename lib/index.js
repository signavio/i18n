'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.init = init;
exports.setLocale = setLocale;
exports.locale = locale;
exports.onChangeLocale = onChangeLocale;
exports.offChangeLocale = offChangeLocale;
exports.reset = reset;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _translate = require('./translate');

var _translate2 = _interopRequireDefault(_translate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var config = {};
var specifiedLocale;
var getLangLoader;
var changeLocaleListeners = [];

var singleton = {
    messages: {}
};

/**
 * The translate function
 * @param text String - The base/singular form of the text to translate
 * @param pluralText String (optional) - The plural form of the text to translate
 * @param options Object (optional) - A mixed object of interpolations and options
 **/
var translate = (0, _translate2.default)(singleton);
exports.default = translate;

/**
 * Returns a promise that resolves as soon as the messages bundle has been loaded. Loads an 
 * an automatically detected locale if setLocale has not been called before.
 *
 * @param getLangLoaderFn A function that returns a resolving function for loading a specified 
 * locale
 * @param configObj A hashmap with keys `default` (default locale) and `map` (mapping of locales to 
 * other locales)
 **/

function init(getLangLoaderFn) {
    var configObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    getLangLoader = getLangLoaderFn;
    config = configObj;
    return new Promise(loadBundle);
}

/**
 * Sets the locale to use. If init has been called before, returns a promise that resolves as soon 
 * as the messages bundle has been loaded
 *
 * @param locale The locale code as a string (e.g.: `en_US`, `en`, etc.)
 */
function setLocale(locale) {
    specifiedLocale = locale;
    if (getLangLoader) {
        return new Promise(loadBundle);
    }
}

/**
 * Returns the currently active locale
 **/
function locale() {
    var langRaw = specifiedLocale || window.navigator.userLanguage || window.navigator.language;
    var langParts = langRaw.replace('-', '_').split('_');

    var language = langParts[0];
    var country = langParts.length > 1 ? '_' + langParts[1].toUpperCase() : '';
    var locale = '' + language + country;

    locale = mapLocale(locale);
    if (!!tryToGetLangLoader(locale)) {
        return locale;
    }

    locale = mapLocale(language); // fall back to the general language
    if (!!tryToGetLangLoader(locale)) {
        return locale;
    }

    return mapLocale(config.default || 'en_US'); // fall back to default
}

function onChangeLocale(listener) {
    changeLocaleListeners.push(listener);
}

function offChangeLocale(listener) {
    changeLocaleListeners = _lodash2.default.remove(changeLocaleListeners, listener);
}

/** 
 * Reset all state as if init and setLocale have never been called. Useful for testing.
 **/
function reset() {
    config = undefined;
    specifiedLocale = undefined;
    getLangLoader = undefined;

    singleton.messages = {};
    changeLocaleListeners = [];
}

function mapLocale(locale) {
    if (!config || !config.map) return locale;
    return config.map[locale] || locale;
}

function tryToGetLangLoader(locale) {
    var waitForLangChunk = undefined;
    try {
        waitForLangChunk = getLangLoader(locale);
    } catch (e) {
        return null;
    }
    return waitForLangChunk;
}

function loadBundle(resolve, reject) {
    if (!_lodash2.default.isFunction(getLangLoader)) {
        throw new Error("Cannot load a bundle as no valid getLangLoader function has been set");
    }

    var waitForLangChunk = tryToGetLangLoader(locale());
    waitForLangChunk(function (messages) {
        singleton.messages = messages;
        _lodash2.default.each(changeLocaleListeners, function (listener) {
            return listener();
        });
        resolve();
    });
}