import i18n, { init, setLocale, reset } from '../src/index';

import React from 'react';

import ReactDOMServer from 'react-dom/server';


import config from './config';

function getLangLoader(locale) {
  // A runtime exception will be throw every time that the requested locale file
  // cannot be found. Webpack uses a regular expression to build all locales as
  // separate bundles.
  let bundleLoader = require(`bundle?lazy!./locales/${locale}.po`);
  return bundleLoader;
};

describe("i18n", function() {

    beforeEach(reset);


    describe('setLocale', function () {

        it('should make sure the correct bundle will be loaded when init is called', function () {
            setLocale('de_DE');
            // return a promise and use mocha's built in promises support
            return init(getLangLoader, config).then(() => {
                expect(i18n('for')).to.equal('für');
            });
        })

        it('should load the respective bundle if called after init', function () {
            setLocale('en_US');
            // return a promise and use mocha's built in promises support
            init(getLangLoader, config).then(() => {
                expect(i18n('for')).to.equal('for');
                setLocale('de_DE');
                return init(getLangLoader, config).then(() => {
                    expect(i18n('for')).to.equal('für');
                });
            });
        });

    });

    describe("#translate", function() {

        it("should return a plain string whenever possible", function() {
            var t = i18n("This is a __test__.", { test: "success" });
            expect(t).to.be.a("string");
            expect(t).to.equal("This is a success.");
        });

        it("should not escape interpolations", function() {
            var t = i18n("This is a __test__.", { test: "<success>" });
            expect(t).to.be.a("string");
            expect(t).to.equal("This is a <success>.");
        });

        it("should support using Markdown in translation messages", function() {
            var t = i18n("This is a **__test__**.", { test: "success", markdown: true });
            expect(React.isValidElement(t)).to.be.true;
            var renderedHtml = ReactDOMServer.renderToStaticMarkup(t);
            expect(renderedHtml).to.equal("<span>This is a <strong>success</strong>.</span>");
        });

        it("should correctly escape interpolations when used with Markdown", function() {
            var t = i18n("This is a **__test__**.", { test: "<success>", markdown: true });
            expect(React.isValidElement(t)).to.be.true;
            var renderedHtml = ReactDOMServer.renderToStaticMarkup(t);
            expect(renderedHtml).to.equal("<span>This is a <strong>&lt;success&gt;</strong>.</span>");
        });

        it.skip("should not be possible to break Markdown from interpolations", function() {
            var t = i18n("**__foo__**", { foo: "bar** baz **baa", markdown: true });
            expect(React.isValidElement(t)).to.be.true;
            var renderedHtml = ReactDOMServer.renderToStaticMarkup(t);
            expect(renderedHtml).to.equal("<span>foo <strong>bar** baz **baa</strong></span>");
        });

        it("should support React components for interpolation values", function() {
            var comp = <div>comp content</div>;
            var t = i18n("before __reactComp__ after", {
                reactComp: comp
            });
            expect(t).to.be.an("array");
            expect(t).to.have.length(3);
            expect(t[0]).to.equal("before ");
            expect(t[1]).to.equal(comp);
            expect(t[2]).to.equal(" after");
        });

        it("should support using the same React component multiple times", function() {
            var comp = <div>comp content</div>;
            var t = i18n("before __reactComp__ within __reactComp__", {
                reactComp: comp
            });
            expect(t).to.be.an("array");
            expect(t).to.have.length(4);
            expect(t[0]).to.equal("before ");
            expect(t[1]).to.deep.equal(comp);
            expect(t[2]).to.equal(" within ");
            expect(t[3]).to.deep.equal(comp);
        });

        it("should keep HTML entities in translation messages unescaped", function() {
            var t = i18n("This is a <__test__>.", { test: React.createElement("span", null, "success") });
            expect(t).to.be.an("array");
            expect(t).to.have.length(3);
            expect(t[0]).to.equal("This is a <");
            expect(t[2]).to.equal(">.");
        });

        //it("should ??? when markdown wraps React component interpolations", function() {
        //    var t = i18n("before **__reactComp__** after", {
        //        reactComp: <div>comp content</div>,
        //        markdown: true
        //    });
        //    console.log(React.renderToStaticMarkup(React.DOM.span(null, t)));
        //});

    });

});

