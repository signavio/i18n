const nodeExternals = require('webpack-node-externals')

module.exports = {
  output: {
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]',
  },
  devtool: 'cheap-module-source-map',
  target: 'node',
  externals: [nodeExternals()],
  module: {
    loaders: [
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
    ],
  },
}
