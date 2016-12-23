const _ = require('lodash')

const env = process.env.NODE_ENV || 'development'

const getConfig = () => {
  switch (env) {
    case 'development': {
      return {
        // list of preprocessors
        preprocessors: {
          'src/**/*.js': ['webpack'],
          'specs/**/*.js': ['webpack'],
        },

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['dots'],

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        browsers: ['Chrome'],

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false,
      }
    }
    case 'production': {
      return {
        // list of preprocessors
        preprocessors: {
          'src/**/*.js': ['webpack', 'coverage'],
          'specs/**/*.js': ['webpack'],
        },

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['dots', 'coverage', 'junit'],

        coverageReporter: {
          type: 'cobertura',
          dir: 'coverage/',
          subdir: '.',
        },

        junitReporter: {
          outputDir: 'junit',
        },

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera (has to be installed with `npm install karma-opera-launcher`)
        // - Safari (only Mac has to be installed with `npm install karma-safari-launcher`)
        // - PhantomJS
        // - IE (only Windows has to be installed with `npm install karma-ie-launcher`)
        browsers: ['PhantomJS'],

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true,
      }
    }
    default: return {}
  }
}

module.exports = (config) => {
  config.set(_.merge({}, {
    // frameworks to use
    frameworks: ['mocha', 'chai', 'phantomjs-shim'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'specs/runner.js',
    ],

    webpack: {
      devtool: 'eval',
      resolve: {
        extensions: ['', '.js', '.json'],
      },
      module: {
        loaders: [
          { test: /\.js$/, exclude: /node_modules/, loaders: ['babel'] },
          { test: /\.po$/, loader: 'json!po' },

          { test: /\.json$/, loader: 'json' },
        ],
      },
      node: {
        fs: 'empty',
        child_process: 'empty',
        net: 'empty',
      },
    },

    webpackMiddleware: {
      stats: {
        colors: true,
      },
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    // List plugins explicitly, since autoloading karma-webpack
    // won't work here
    plugins: [
      require('karma-webpack'),
      require('karma-mocha'),
      require('karma-chai'),

      require('karma-phantomjs-shim'),
      require('karma-spec-reporter'),
      require('karma-phantomjs-launcher'),
      require('karma-chrome-launcher'),
      require('karma-junit-reporter'),
      require('karma-coverage'),
    ],
  }, getConfig()))
}
