import glob from 'glob'
import ProgressBar from 'progress'
import { transformFileSync } from 'babel-core'
import babelGettextExtractor from './babel-gettext-extractor'

const defaultBabelConfig = {
  presets: ['react', 'stage-2'],
}

export default (fileGlobs, getConfig, showProgress = false) => {
  const files = glob.sync(process.argv[2])

  const progressBar = showProgress
    ? new ProgressBar(' extracting [:bar] :percent :fileName', {
      total: files.length,
      width: 10,
    })
    : { tick: () => {} }

  files.forEach((fileName) => {
    // eslint-disable-next-line no-console
    progressBar.tick(1, { fileName })

    const { babel = defaultBabelConfig, ...config } = getConfig(fileName)
    const { plugins = [] } = babel

    transformFileSync(fileName, {
      ...babel,
      plugins: [...plugins, [babelGettextExtractor, config]],
    })
  })
}
