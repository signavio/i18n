// @flow
import glob from 'glob'
import ProgressBar from 'progress'
import { transformFileSync } from '@babel/core'
import babelGettextExtractor from './babel-gettext-extractor'

import getConfig from './config'

if (process.argv.length < 3) {
  throw new Error(
    `Invalid arguments, expected: 'node i18n/scripts/extract.js "source_file_pattern"', got: ${process.argv.join(
      ' '
    )}`
  )
}

// glob sync returns an array of filenames matching the pattern
const files = glob.sync(process.argv[2])

const progressBar = new ProgressBar(' extracting [:bar] :percent :fileName', {
  total: files.length,
  width: 10,
})

files.forEach((fileName: string) => {
  // eslint-disable-next-line no-console
  progressBar.tick(1, { fileName })

  const { babel = {}, ...config } = getConfig(fileName)
  const { plugins = [] } = babel

  transformFileSync(fileName, {
    ...babel,
    plugins: [...plugins, [babelGettextExtractor, config]],
  })
})
