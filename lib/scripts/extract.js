'use strict';

var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var jsxgettext = require('jsxgettext');

if (process.argv.length < 4) {
    throw new Error('Invalid arguments, expected: `node i18n/scripts/extract.js source_file ... pot_file`');
}

var templatePath = path.resolve(process.cwd(), _.last(process.argv));

var sources = {};
_.each(process.argv.slice(2, process.argv.length - 1), function (fileName) {

    if (_.endsWith(fileName, '.spec.js')) {
        // skip specs
        return;
    }

    sources[fileName] = fs.readFileSync(fileName, 'utf8');
});

var result = jsxgettext.generateFromBabel(sources, {
    keyword: 'i18n',
    plural: 'i18n',
    output: templatePath,
    babelOptions: {
        stage: 0
    }
});

fs.writeFileSync(templatePath, result, 'utf8');