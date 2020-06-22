import { exec } from 'child_process'
import path from 'path'

if (process.argv.length < 4) {
  throw new Error(
    'Invalid arguments, expected: `node i18n/scripts/merge.js pot_file po_file ...`'
  )
}

const [, , ...cliArguments] = process.argv

const flags = []
const files = []

cliArguments.forEach((arg) => {
  if (arg.startsWith('-')) {
    flags.push(arg)
  } else {
    files.push(arg)
  }
})

const [potFile, ...poFiles] = files
const templatePath = path.resolve(process.cwd(), potFile)

poFiles.forEach((fileName) => {
  exec(
    `msgmerge ${flags.join(' ')} -o ${fileName} ${fileName} ${templatePath}`,
    (error, stdout, stderr) => {
      // eslint-disable-next-line no-console
      console.log(stdout)

      if (error) {
        // eslint-disable-next-line no-console
        console.error(stderr)
      }
    }
  )
})
