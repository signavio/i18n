const nodeExternals = require('webpack-node-externals')
const path = require('path')

const isCoverage = process.env.NODE_ENV === 'coverage'

const loaders = [
  {
    test: /\.js$/,
    loader: 'babel-loader',
  },
  {
    test: /\.po$/,
    loader: 'json-loader!po-loader',
  },
  {
    test: /\.json$/,
    loader: 'json-loader',
  },
]

if (isCoverage) {
  loaders.unshift({
    test: /\.js$/,
    include: path.resolve('src'),
    loader: 'istanbul-instrumenter-loader',
  })
}

module.exports = {
  output: {
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]',
  },
  devtool: 'cheap-module-source-map',
  target: 'node',
  externals: [nodeExternals()],
  module: { loaders },
}
