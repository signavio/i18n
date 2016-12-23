import glob from 'glob'

import _ from 'lodash'
import { transformFileSync } from 'babel-core'
import babelGettextExtractor from './babel-gettext-extractor'

import getConfig from './config'

if (process.argv.length < 4) {
  throw new Error('Invalid arguments, expected: `node i18n/scripts/extract.js "source_file_pattern"`')
}

const files = glob.sync(process.argv[2])

_.each(files, (fileName) => {
  // eslint-disable-next-line no-console
  console.log(fileName)

  const config = getConfig(fileName)

  transformFileSync(fileName, {
    plugins: [
      [babelGettextExtractor, config],
    ],
  })
})
