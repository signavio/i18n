import fs from 'fs';
import path from 'path';
import glob from 'glob';

import _ from 'lodash';
import { transformFileSync } from 'babel';
import babelGettextExtractor from './babel-gettext-extractor';

if(process.argv.length < 4) {
    throw new Error('Invalid arguments, expected: `node i18n/scripts/extract.js source_file`');
}

var templatePath = path.resolve(process.cwd(), _.last(process.argv));

var files = glob.sync(process.argv[2]);

var sources = {};
_.each(files, function (fileName) {

    if(_.endsWith(fileName, '.spec.js')) {
        // skip specs
        return;
    }

    transformFileSync(fileName, {
        plugins: [ babelGettextExtractor ]
    });
});
