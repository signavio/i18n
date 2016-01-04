import _ from "lodash";

/**
 * Load each test using webpack's dynamic require with contexts.
 */
var context = require.context('./', true, /\.spec\.js$/);
context.keys().forEach(context);

var allFiles = require.context('../src', false, /\.jsx?$/);

var blacklist = [/.*\.spec.js$/, /scripts/];

_.without(allFiles.keys(), context.keys()).forEach((file) => {
    if( _.find(blacklist, (pattern) => pattern.test(file)) ) {
        return;
    }

    allFiles(file);
});
