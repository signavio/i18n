import getConfig from './config'
import extract from '../extract'

if (process.argv.length < 3) {
  throw new Error(
    `Invalid arguments, expected: 'node i18n/scripts/extract.js "source_file_pattern"', got: ${process.argv.join(
      ' '
    )}`
  )
}

const fileGlobs = process.argv[2]
extract(fileGlobs, getConfig, true)
