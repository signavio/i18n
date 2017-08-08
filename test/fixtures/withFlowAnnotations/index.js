type ComplexT = {
  [key: string]: string,
}

type GenericT<T> = {
  [key: string]: T,
}

function Function<T>(one: string, two: ComplexT, three: GenericT<T>): T {
  return i18n('I got extracted')
}

const Const = <T>(one: string, two: ComplexT, three: GenericT<T>): T =>
  i18n('I got extracted')

const nested = wrapper({
  onChange: <T>(): T => <V>(): V => i18n('I got extracted'),
})
