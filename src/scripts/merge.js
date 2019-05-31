import { exec } from 'child_process'
import path from 'path'

if (process.argv.length < 4) {
  throw new Error(
    'Invalid arguments, expected: `node i18n/scripts/merge.js pot_file po_file ...`'
  )
}

const templatePath = path.resolve(process.cwd(), process.argv[2])

process.argv.slice(3).forEach(fileName => {
  exec(
    `msgmerge -o ${fileName} ${fileName} ${templatePath}`,
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
