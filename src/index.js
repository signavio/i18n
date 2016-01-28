import _ from 'lodash';

import createTranslate from './translate';

var config = {};
var specifiedLocale;
var getLangLoader;
var changeLocaleListeners = [];

const singleton = {
    messages: {}
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
export function init(getLangLoaderFn, configObj={}) {
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
export function setLocale(locale) {
    specifiedLocale = locale;
    if(getLangLoader) {
        return new Promise(loadBundle);
    }
}


/**
 * Returns the currently active locale
 **/
export function locale() {
    let langRaw = specifiedLocale || 
        (window && (window.navigator.userLanguage || window.navigator.language)) || 
        "en_US";
    let langParts = langRaw.replace('-', '_').split('_');

    let language = langParts[0];
    let country = langParts.length > 1 ? '_' + langParts[1].toUpperCase() : '';
    let locale = `${language}${country}`;

    locale = mapLocale(locale);
    if(!!tryToGetLangLoader(locale)) {
        return locale;
    }

    locale = mapLocale(language); // fall back to the general language
    if(!!tryToGetLangLoader(locale)) {
        return locale;
    }

    return mapLocale(config.default || 'en_US'); // fall back to default
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
    changeLocaleListeners = [];
}




function mapLocale(locale) {
    if(!config || !config.map) return locale;
    return config.map[locale] || locale;
}


function tryToGetLangLoader(locale) {
    let waitForLangChunk;
    try {
        waitForLangChunk = getLangLoader(locale);
    } catch (e) {
        return null;
    }
    return waitForLangChunk;
}

function loadBundle(resolve, reject) {
    if(!_.isFunction(getLangLoader)) {
        throw new Error("Cannot load a bundle as no valid getLangLoader function has been set");
    }

    let waitForLangChunk = tryToGetLangLoader(locale());
    waitForLangChunk(function(messages) {
        singleton.messages = messages;
        _.each(changeLocaleListeners, (listener) => listener());
        resolve();
    });
}