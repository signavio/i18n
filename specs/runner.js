import _ from 'lodash';


/**
 * Load each test using webpack's dynamic require with contexts.
 */
var context = require.context('./', true, /\.spec\.js$/);
context.keys().forEach(context);
