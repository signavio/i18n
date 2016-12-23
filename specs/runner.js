import _ from 'lodash'

/**
 * Load each test using webpack's dynamic require with contexts.
 */
const context = require.context('./', true, /\.spec\.js$/)
context.keys().forEach(context)

const allFiles = require.context('../src', false, /\.jsx?$/)

const blacklist = [/.*\.spec.js$/, /scripts/]

_.without(allFiles.keys(), context.keys()).forEach((file) => {
  if ( _.find(blacklist, (pattern) => pattern.test(file)) ) {
    return
  }

  allFiles(file)
})
