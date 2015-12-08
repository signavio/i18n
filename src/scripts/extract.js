import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import { transformFileSync } from 'babel';
import babelGettextExtractor from './babel-gettext-extractor';

if(process.argv.length < 4) {
    throw new Error('Invalid arguments, expected: `node i18n/scripts/extract.js source_file ... pot_file`');
}

var templatePath = path.resolve(process.cwd(), _.last(process.argv));

var sources = {};
_.each(process.argv.slice(2, process.argv.length-1), function (fileName) {

    if(_.endsWith(fileName, '.spec.js')) {
        // skip specs
        return;
    }

    transformFileSync(fileName, {
        plugins: [ babelGettextExtractor ]
    });
});
