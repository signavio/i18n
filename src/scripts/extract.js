// @flow
import glob from 'glob'
import ProgressBar from 'progress'
import { transformFileSync } from '@babel/core'
import fs from 'fs'
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
const outputfileName = process.argv[3]
const replacementsJSONPath = process.argv[4]

let replacements

if (replacementsJSONPath) {
  try {
    replacements = JSON.parse(fs.readFileSync(replacementsJSONPath, 'utf8'))
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}




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
    plugins: [...plugins, [babelGettextExtractor, {...config, fileName: config.fileName || outputfileName, replacements}]],
  })
})
