# @signavio/i18n

[![CircleCI][build-badge]][build]
[![npm package][npm-badge]][npm]

Minimalist gettext style i18n for JavaScript

## Features

- [Supports React components as interpolations](#interpolations)
- [Pluralization support](#pluralization) (ngettext style)
- [markdown support](#markdown)
- [replacements support](#replacements)
- Compatible with [webpack po-loader](https://github.com/perchlayer/po-loader)
- Comes with scripts for extracting translation strings from JavaScript (Babel) sources and updating .pot and .po files

## Installation

```shell
yarn add @signavio/i18n
```

## Setup

Add a section like the following to your `packages.json`:

```json
{
  "scripts": {
    "i18n-init": "cd src/locales && msginit --no-translator --input messages.pot --locale",
    "i18n": "i18n-extract \"src/**/*.js\" src/locales/messages.pot && i18n-merge src/locales/messages.pot src/locales/*.po"
  }
}
```

Create the file `.i18nrc` and add a configuration object for gettext message extraction:

```json
{
  "headers": "<POT_HEADERS>",
  "fileName": "<PATH_TO_POT>",
  "baseDirectory": "<PATH_TO_BASEDIR>"
}
```

**IMPORTANT:** when the second command line argument is passed to the `i18n-extract` command, it will overwrite the `fileName` field of the `.i18nrc` config.

More available options are documented here: https://github.com/getsentry/babel-gettext-extractor

Optionally, you can also define your babel configuration in the `.i18nrc` file.
This allows you to ignore your project's `.babelrc` file when extracting
messages, which is helpful if your project is using a legacy version of babel
(\<6).

```javascript
{
  "fileName": "<PATH_TO_POT>",
  "babel": {
    "babelrc": false,
    // other babel settings
  }
}
```
## Extraction
`i18n-extract` command will extract up to first two string arguments of the `i18n` call and treat them as translation keys.
Message context property will be extracted in the same way as well.


Having the original JS code: 
```javascript
// translators: singular
i18n('Translation');

// translators: plural
i18n('Another translation', 'Another translations');

// translators: context
i18n('Translation', {context: 'button'});

```
The .pot file will have the following content

```
#. singular
msgid "Translation"
msgstr ""

#. plural
msgid "Another translation"
msgid_plural "Another translations"
msgstr[0] ""
msgstr[1] ""

#. context
msgctxt "button"
msgid "Translation"
msgstr ""
```

**IMPORTANT:** only the following parameters will be extracted:
- String literals (`'single'` and `"double"` quotes)
- Simple template literals (``backticks`` without any nested expressions and tags)
- Their concatenation with `+` operator

Otherwise the translation function call will be omitted.

These translations will be extracted:
```javascript

i18n('Translation');
i18n("Translation");
i18n(`Translation`);


i18n('Translation ' + "with" + ` concatenation`);
i18n('Translation ' + "with" + ` concatenation`, 'Translation ' + "with" + ` concatenation plural`);

```

These contexts will be extracted:
```javascript
i18n("Translation", {context: 'button'});
i18n("Translation", {context: "button"});
i18n("Translation", {context: `button`});


i18n("Translation", {context: 'context' + ` with ` + "concatenation"});
```

These translations will be ignored:

```javascript

i18n('Translation' + 123);
i18n("Translation" + {});
i18n("Translation" + foobar);
i18n(`Translation${"nested expression with string"}`);
i18n(`Translation${foobar}`);
i18n(someTag`Translation`);

i18n('Translation ' + "with" + ` concatenation`);
i18n('Translation ' + "with" + ` concatenation`, 'Translation ' + "with" + ` concatenation plural`);
```

These contexts will be ignored:

```javascript

i18n("Translation", {context: 'button' + 123});
i18n("Translation", {context: "button" + {}});
i18n("Translation", {context: "button" + foobar});
i18n("Translation", {context: `button ${'nested expression with string'}`});
i18n("Translation", {context: `button ${foobar}`});
i18n("Translation", {context: 'context' + ` with ` + "concatenation"});
```

**IMPORTANT:** when the translation key is valid and the context is not, the translation will be extracted without context.


## Usage

Add the translations to the PO files, and initialize the i18n module in your application using the `init` function:

```javascript
import i18n, { init, setLocale } from '@signavio/i18n'

function getLangLoader(locale) {
  // Lazy load the translation bundles
  return require(`bundle?lazy!json!po!./locales/${locale}.po`)
}

const config = {
  // the default locale to use if the browser preference locale is not available
  default: 'en_US',
  // optional mapping of locales
  map: {
    en: 'en_US',
    de: 'de_DE',
  },
  // optional regular expression pattern for custom interpolation syntax
  interpolationPattern: '__(\\w+)__', // this is the default value
}

init(getLangLoader, config).then(() => {
  // promise will be resolved when the translation bundle for the active locale has been loaded
  alert(i18n('Hello world!'))
  // >> Hello world!

  // switch to another language
  setLocale('de').then(() => {
    alert(i18n('Hello world!'))
    // >> Hallo Welt!
  })
})
```

### Interpolations

Interpolations make it easier to include variable content into messages without confusing translators.
For instance, if you want to include a computed number in a message, you can do it like this:

```javascript
const available = 100
const count = available / 10

i18n('Showing __count__ of __available__ entires.', { count, available })
```

For your convenience interpolations also support React elements.
So you can do things like:

```jsx
i18n('Contact __supportLink__', {
  supportLink: <a href="mailto:support@signavio.com">Support</a>,
})
```

The default syntax for interpolations is a group of characters or numbers (`\w+`) wrapped in double underscores (`__`). Note that the identifiers `context` and `markdown` are reserved and should not be used as a placeholder (see docs below).

If you require a different syntax this can be customized using the init option `interpolationPattern`. Internally, pattern value will be used to create a regular expression for matching interpolation placeholder like this:

```
new RegExp(interpolationPattern, 'g')
```

It must contain a capturing group (`(\w+)`) for capturing the interpolation key.

### Pluralization

Often times you get to the situation that the same message needs to look slightly different depending on whether you talk about one or more things.
Handling this can add quite a lot of unnecessary code.
You can circumvent this with the built in support for pluralizations.

```javascript
i18n('Showing __count__ item', 'Showing __count__ items', { count })
```

To use this feature simply pass two different translations to the `i18n` function.
The first string is used for the singular case (`count == ±1` ) and the second one for the plural case.
Note that you **have** to hand in a variable called `count`.
This variable is used to decide which version of the translation to choose.

You can also use multiple variables, but only the `count` variable is used to select the translation:

```javascript
i18n(
    'Showing __count__ item out of __total__',
    'Showing __count__ items out of __total__',
    { count, total }
)
```

### Message context

Sometimes the same translation key can have different meanings based on the context in which is it used.
Message context offers a solution to this problem.
If you specify the optional `context` parameter you can have different translations for the same translation key.

```javascript
i18n('Ok', { context: 'button' })
```

### Markdown

Another convenience of `@signavio/i18n` is the optional support for markdown in translations.
By default this is turned off, but you can activate it by setting the `markdown` option to `true`.

```javascript
i18n('I want _this_ to be **bold**', {
  markdown: true,
})
```
### Replacements


#### Extraction

Sometimes there may be cases when you need to rename several entities across the whole project, but keep the both versions of translations and show them based on the feature flag.
Doing that manually could be laborious, that's why `i18n-extract` supports a path to the replacements json as an optional third command line argument.

```json
{
  "scripts": {
    "i18n-init": "cd src/locales && msginit --no-translator --input messages.pot --locale",
    "i18n": "i18n-extract \"src/**/*.js\" src/locales/messages.pot <PATH_TO_REPLACEMENTS_JSON> && i18n-merge src/locales/messages.pot src/locales/*.po"
  }
}
```

Replacements json file should be an object where the keys are translation context names.
Values of each context are objects for the original translation strings and the values are the new ones.

```json
{
  "some context": {
    "Old translation": "New translation",
    "Old translation2": "New translation2"
  }
}
```

If the translation does not have the context, then it should be stored in the `""` (empty string) field.

```json
{
  "": {
    "Old translation": "New translation without context"
  },
  "some context": {
    "Old translation": "New translation with some context"
  }
}
```

Having the original JS code:

```javascript
// translators: comment 1
i18n('Old translation')
// translators: comment 2
i18n('Old translation2')
```

The .pot file will have the following content

```
#. comment 1
msgid "Old translation"
msgstr ""

#. comment 1 REPLACEMENT for "New translation"
msgid "New translation"
msgstr ""

#. comment 2
msgid "Old translation2"
msgstr ""

#. comment 2 REPLACEMENT for "New translation2"
msgid "New translation2"
msgstr ""

```

#### Usage

To use the replacements instead of the old strings in runtime pass the same replacements object which was used in the extraction step to the `init` function:

```javascript
import replacements from 'replacements.json'
init(getLangLoader, config, replacements).then(() => {
  // promise will be resolved when the translation bundle for the active locale has been loaded
  alert(i18n('Hello world!'))
  // >> Hello world!

  // switch to another language
  setLocale('de').then(() => {
    alert(i18n('Hello world!'))
    // >> Hallo Welt!
  })
})
```

### Publishing Packages

Read the following [guide](PUBLISH.md) to publish packages of the i18n repository

[build-badge]: https://circleci.com/gh/signavio/i18n/tree/master.svg?style=shield&circle-token=:circle-token
[build]: https://circleci.com/gh/signavio/i18n/tree/master
[npm-badge]: https://img.shields.io/npm/v/@signavio/i18n.png?style=flat-square
[npm]: https://www.npmjs.org/package/@signavio/i18n
