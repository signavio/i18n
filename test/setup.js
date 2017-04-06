// THIS FILE NEEDS TO STAY IN THIS SHITTY FORMAT

// init jsdom
var jsdom = require('jsdom').jsdom;
var doc = jsdom('<!doctype html><html><head><meta charset="utf-8"></head><body><script/></body></html>');
var win = doc.defaultView;

// globalize some stuff
global.document = doc;
global.window = win;
win.console = global.console;
global.navigator = { userAgent: "Node.js"};
global.Blob = window.Blob;

// setup chai plugins
var chai = require('chai');
var chaiEnzyme = require('chai-enzyme');
var chaiFiles = require('chai-files');
chai.use(chaiEnzyme());
chai.use(chaiFiles)

// other re-exports for testing so that other packages do not have to add all testing deps
var enzyme = require('enzyme');

// export preconfigured chai
module.exports = {
  mount: enzyme.mount,
  shallow: enzyme.shallow,
  expect: chai.expect,
};
