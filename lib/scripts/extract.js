'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _babel = require('babel');

var _babelGettextExtractor = require('./babel-gettext-extractor');

var _babelGettextExtractor2 = _interopRequireDefault(_babelGettextExtractor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (process.argv.length < 4) {
    throw new Error('Invalid arguments, expected: `node i18n/scripts/extract.js source_file ... pot_file`');
}

var templatePath = _path2.default.resolve(process.cwd(), _lodash2.default.last(process.argv));

var sources = {};
_lodash2.default.each(process.argv.slice(2, process.argv.length - 1), function (fileName) {

    if (_lodash2.default.endsWith(fileName, '.spec.js')) {
        // skip specs
        return;
    }

    (0, _babel.transformFileSync)(fileName, {
        plugins: [_babelGettextExtractor2.default]
    });
});