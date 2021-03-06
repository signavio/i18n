module.exports = {
  presets: [
    [
      '@babel/preset-env',
      process.env['BABEL_ENV'] === 'es6'
        ? {
            modules: false,
          }
        : {},
    ],
    '@babel/preset-react',
    '@babel/preset-flow',
  ],
  plugins: [
    '@babel/plugin-transform-proto-to-assign',
    '@babel/plugin-transform-runtime',
    'transform-remove-console',
    'transform-remove-debugger',
    'transform-minify-booleans',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-syntax-import-meta',
    [
      '@babel/plugin-proposal-decorators',
      {
        legacy: true,
      },
    ],
    '@babel/plugin-proposal-function-sent',
    '@babel/plugin-proposal-throw-expressions',
  ],
}
