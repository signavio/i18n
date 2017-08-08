// @flow
import glob from 'glob'

import { each } from 'lodash'
import { transformFileSync } from 'babel-core'
import babelGettextExtractor from './babel-gettext-extractor'

import getConfig from './config'

if (process.argv.length < 3) {
  throw new Error(
    `Invalid arguments, expected: 'node i18n/scripts/extract.js "source_file_pattern"', got: ${process.argv.join(
      ' '
    )}`
  )
}

const files = glob.sync(process.argv[2])

each(files, (fileName: string) => {
  // eslint-disable-next-line no-console
  console.log(fileName)

  const { babel = {}, ...config } = getConfig(fileName)
  const { plugins = [] } = babel

  transformFileSync(fileName, {
    ...babel,
    plugins: [...plugins, [babelGettextExtractor, config]],
  })
})
