import _slicedToArray from "@babel/runtime/helpers/slicedToArray";
import _defineProperty from "@babel/runtime/helpers/defineProperty";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

import { marked } from 'marked';
import React from 'react';
var defaultOptions = {
  markdown: !1
};
export default (function (singleton) {
  return function translate(text, plural, options) {
    // singleton.messages contains the translation messages for the currently active languae
    // format: singular key -> [ plural key, singular translations, plural translation ]
    var finalOptions = options;
    var finalPlural = plural;

    if (!finalOptions && isPlainObject(finalPlural)) {
      finalOptions = plural;
      finalPlural = undefined;
    }

    finalOptions = _objectSpread(_objectSpread(_objectSpread({}, defaultOptions), finalOptions), {}, {
      replacementsContext: finalOptions && finalOptions.context || 'no_context',
      context: finalOptions && finalOptions.context ? "".concat(finalOptions.context, "\x04") : ''
    }); // singleton.replacements optionally contains the translation replacements for the first two string arguments by context

    if (singleton.replacements && singleton.replacements[finalOptions.replacementsContext]) {
      var replacementsContext = singleton.replacements[finalOptions.replacementsContext];

      if (replacementsContext) {
        if (typeof text === 'string' && replacementsContext[text]) {
          text = replacementsContext[text];
        }

        if (typeof finalPlural === 'string' && replacementsContext[finalPlural]) {
          finalPlural = replacementsContext[finalPlural];
        }
      }
    }

    var _slice = (singleton.messages[finalOptions.context + text] || [null, null, null]).slice(1),
        _slice2 = _slicedToArray(_slice, 2),
        translatedSingular = _slice2[0],
        translatedPlural = _slice2[1]; // find the raw translation message


    var translation;

    if (finalPlural && needsPlural(finalOptions)) {
      translation = translatedPlural && isString(translatedPlural) ? translatedPlural : finalPlural;
    } else {
      translation = translatedSingular && isString(translatedSingular) ? translatedSingular : text;
    } // apply markdown processing if necessary


    if (finalOptions.markdown) {
      translation = applyMarkdown(translation);
    } // insert regular interpolations


    translation = insertInterpolations(translation, finalOptions); // insert React component interpolations

    var result = insertReactComponentInterpolations(translation, finalOptions);
    return result.length === 1 ? result[0] : result;
  };

  function needsPlural(options) {
    return isNumber(options.count) && Math.abs(options.count) !== 1;
  }

  function isWrappedInPTag(translation) {
    return translation.lastIndexOf('<p>') === 0 && translation.indexOf('</p>') === translation.length - 5;
  }

  function applyMarkdown() {
    var translation = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    // Escape underscores.
    // (Since we use underscores to denote interpolations, we have to
    // exclude them from the markdown notation. Use asterisk (*) instead.)
    var finalTranslation = marked(translation.replace(/_/g, '\\_')); // remove single, outer wrapping <p>-tag

    if (isWrappedInPTag(finalTranslation)) {
      // last occurrence of <p> is at the start, first occurrence of </p> is a the very end
      finalTranslation = finalTranslation.substring(3, finalTranslation.length - 5);
    }

    return finalTranslation.replace(/\\_/g, '_');
  }

  function htmlStringToReactComponent(html, _ref) {
    var key = _ref.key;
    // eslint-disable-next-line react/no-danger
    return /*#__PURE__*/React.createElement("span", {
      key: key,
      dangerouslySetInnerHTML: {
        __html: html
      }
    });
  }

  function insertInterpolations() {
    var translation = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var options = arguments.length > 1 ? arguments[1] : undefined;
    var regularInterpolations = {};

    for (var _i = 0, _Object$entries = Object.entries(options); _i < _Object$entries.length; _i++) {
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
          key = _Object$entries$_i[0],
          value = _Object$entries$_i[1];

      if (key !== 'markdown' && ! /*#__PURE__*/React.isValidElement(value)) {
        regularInterpolations[key] = options[key];
      }
    }

    var finalTranslation = translation;
    Object.entries(regularInterpolations).forEach(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 2),
          key = _ref3[0],
          val = _ref3[1];

      finalTranslation = finalTranslation.replace(new RegExp(singleton.interpolationPattern.replace('(\\w+)', key), 'g'), options.markdown ? escapeHtml(val) : val // only escape options when using markdown
      );
    });
    return finalTranslation;
  }

  function insertReactComponentInterpolations(translation, options) {
    var result = [];
    var match;
    var substr;
    var start = 0;
    var interpolationRegExp = new RegExp(singleton.interpolationPattern, 'g');

    while ((match = interpolationRegExp.exec(translation)) !== null) {
      var key = match[1];
      var component = options[key];

      if (match.index > 0) {
        substr = translation.substring(start, match.index);
        result.push(options.markdown ? htmlStringToReactComponent(substr, {
          key: result.length
        }) : substr);
      }

      if ( /*#__PURE__*/React.isValidElement(component)) {
        result.push( /*#__PURE__*/React.cloneElement(component, {
          key: result.length
        }));
      } else {
        // no interpolation specified, leave the placeholder unchanged
        result.push(match[0]);
      }

      start = interpolationRegExp.lastIndex;
    } // append part after last match


    if (start < translation.length) {
      substr = translation.substring(start);
      result.push(options.markdown ? htmlStringToReactComponent(substr, {
        key: result.length
      }) : substr);
    } // re-concatenate all string elements


    return result.reduce(function (acc, element) {
      var lastAccumulatedElement = acc[acc.length - 1];

      if (isString(element) && isString(lastAccumulatedElement)) {
        // eslint-disable-next-line no-param-reassign
        acc[acc.length - 1] = lastAccumulatedElement + element;
      } else {
        acc.push(element);
      }

      return acc;
    }, []);
  }
}); // Lodash Escape Implementation
// See https://github.com/lodash/lodash/blob/master/escape.js

export function escapeHtml(unsafe) {
  // Used to map characters to HTML entities.
  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }; // Used to match HTML entities and HTML characters.

  var reUnescapedHtml = /[&<>"']/g; // Cast (null,undefined,[] and 0 to empty string => '')

  var reHasUnescapedHtml = RegExp(reUnescapedHtml.source);
  return unsafe && reHasUnescapedHtml.test(unsafe) ? unsafe.replace(reUnescapedHtml, function (chr) {
    return htmlEscapes[chr];
  }) : unsafe || '';
}

var isString = function isString(str) {
  return str && typeof str.valueOf() === 'string';
};

var isNumber = function isNumber(num) {
  return num != null && typeof num.valueOf() === 'number';
};

var isPlainObject = function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
};