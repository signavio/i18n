export type AddLocationT = 'full' | 'file' | 'never'

export type HeaderTypeT = ''

export type HeadersT = {
  [key: HeaderTypeT]: string,
}

export type ConfigT = {
  functionName?: string,
  fileName?: string,
  headers?: HeadersT,
  addLocation?: AddLocationT,
  noLocation?: boolean,
}

export type AstNodeT = {
  type: string,
}

export type MapT<K, V> = {
  [key: K]: V,
}

export type ObjectPropertyT = {
  key: {
    name: string,
  },
}
