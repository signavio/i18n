# i18n
Minimalist gettext style i18n for JavaScript used internally at Effektif

## Features
- Pluralization support (ngettext style)
- Supports React components as interpolations
- Optional markdown support
- Compatible with [webpack po-loader](https://github.com/perchlayer/po-loader)
- Comes with scripts for extracting translation strings from JavaScript (Babel) sources and updating .pot and .po files 


## Installation

```
npm install --save @signavio/i18n
```


## Setup

Add the configuration for gettext message extraction to your `.babelrc`:

```
    "extra": {
        "gettext": {
            "headers": <POT_HEADERS>,
            "fileName": <PATH_TO_POT>,
            "baseDirectory": <PATH_TO_BASEDIR>
        }
    }
```

All available options are documented here: https://github.com/getsentry/babel-gettext-extractor


Add a section like the following to the `packages.json`:

```
    scripts": {
        "i18n-init": "cd src/locales && msginit --no-translator --input messages.pot --locale",
        "i18n": "i18n-extract src/**/*.js src/locales/messages.pot && i18n-merge src/locales/messages.pot src/locales/*.po"
    },
```

## Usage

Add the translations to the PO files, and initialize the i18n module in your application using the `init` function:

```
import i18n, { init, setLocale, reset } from '@signavio/i18n';

function getLangLoader(locale) {
    // Lazy load the translation bundles
    let bundleLoader = require(`bundle?lazy!json!po./locales/${locale}.po`);
    return bundleLoader;
};

var config = {
    default: 'en_US', // the default locale to use if the browser preference locale is not available
    map: {  // optional mapping of locales
        en: 'en_US',
        de: 'de_DE'
    }
};

init(getLangLoader, config).then(() => {
    // promise will be resolved when the translation bundle for the active locale has been loaded
    alert(i18n("Hello world!"));
})
```