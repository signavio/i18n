'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _marked = require('marked');

var _marked2 = _interopRequireDefault(_marked);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultOptions = {
    markdown: false
};

exports.default = function (singleton) {
    return function translate(text, pluralText, options) {

        // singleton.messages contains the translation messages for the currently active languae
        // format: singular key -> [ plural key, singular translations, plural translation ]

        if (!options && _lodash2.default.isObject(pluralText)) {
            options = pluralText;
            pluralText = undefined;
        }
        options = _lodash2.default.extend({}, defaultOptions, options);

        var message = singleton.messages[text] || [null, null];

        // find the raw translation message
        var translation = undefined;
        if (pluralText && needsPlural(options)) {
            translation = message.length > 2 && _lodash2.default.isString(message[2]) ? message[2] : pluralText;
        } else {
            translation = _lodash2.default.isString(message[1]) ? message[1] : text;
        }

        // apply markdown processing if necessary
        if (options.markdown) {
            translation = applyMarkdown(translation);
        }

        // insert regular interpolations
        translation = insertInterpolations(translation, options);

        // insert React component interpolations
        var result = insertReactComponentInterpolations(translation, options);

        return result.length === 1 ? result[0] : result;
    };
};

function needsPlural(options) {
    return _lodash2.default.isNumber(options.count) && options.count > 1;
}

function applyMarkdown(translation) {
    // Escape underscores.
    // (Since we use underscores to denote interpolations, we have to
    // exclude them from the markdown notation. Use asterisk (*) instead.)
    translation = translation.replace(/_/g, "\\_");

    translation = (0, _marked2.default)(translation);

    // remove single, outer wrapping <p>-tag
    if (translation.lastIndexOf("<p>") === 0 && translation.indexOf("</p>") === translation.length - 5) {
        // last occurrence of <p> is at the start, first occurence of </p> is a the very end
        translation = translation.substring(3, translation.length - 5);
    }

    return translation.replace(/\\_/g, "_");
}

function htmlStringToReactComponent(html) {
    return _react2.default.createElement('span', { dangerouslySetInnerHTML: { __html: html } });
}

function insertInterpolations(translation, options) {
    var regularInterpolations = _lodash2.default.pick(options, function (val, key, obj) {
        return !_lodash2.default.has(defaultOptions, key) && !_react2.default.isValidElement(val);
    });
    _lodash2.default.each(regularInterpolations, function (val, key) {
        translation = translation.replace(new RegExp("__" + key + "__", "g"), options.markdown ? _lodash2.default.escape(val) : val // only escape options when using markdown
        );
    });
    return translation;
}

function insertReactComponentInterpolations(translation, options) {
    var result = [];
    var placeholderRegex = /__(\w+)__/g;
    var match = undefined,
        substr = undefined;
    var start = 0;

    while ((match = placeholderRegex.exec(translation)) !== null) {
        var key = match[1];
        var component = options[key];

        if (match.index > 0) {
            substr = translation.substring(start, match.index);
            result.push(options.markdown ? htmlStringToReactComponent(substr) : substr);
        }

        if (_react2.default.isValidElement(component)) {
            result.push(_lodash2.default.contains(result, component) ? _react2.default.cloneElement(component) : component);
        } else {
            // interpolation value is not a React component

            if (_lodash2.default.has(options, key)) {
                result.push(component);
            } else {
                // no interpolation specified, leave the placeholder unchanged
                result.push(match[0]);
            }
        }

        start = placeholderRegex.lastIndex;
    }

    if (start < translation.length) {
        substr = translation.substring(start);
        result.push(options.markdown ? htmlStringToReactComponent(substr) : substr);
    }

    return result;
}