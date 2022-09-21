i18n(`Hello World`)

i18n(`Hello World`, {context: `someContext`})

i18n(`Hello` + ` World` + ` ` + `concat`)

i18n(`Hello` + " World" + ` ` + 'concat' + ' ' + 'different quotes')


i18n(`Not in ${'the'} result`)

const foo = () => {}
i18n('Not' + ` ${'in'}` + 'the ' + `result` + null + 123)
i18n('Not' + ` ${'in'}` + 'the ' + `result${foo}` )