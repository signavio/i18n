import _ from 'lodash';


chai.use(require("chai-string"));
chai.use(require("sinon-chai"));
chai.use(require("chai-jquery"));

import sinonStubPromise from 'sinon-stub-promise';
sinonStubPromise(sinon);

/**
 * Load each test using webpack's dynamic require with contexts.
 */
var context = require.context('./', true, /\.spec\.js$/);
context.keys().forEach(context);
