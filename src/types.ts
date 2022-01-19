import { TransformOptions } from '@babel/core'

export type AddLocationT = 'full' | 'file' | 'never'

export type HeadersT = {
  [key: string]: string
}

export type ConfigT = {
  functionName?: string
  fileName?: string
  headers?: HeadersT
  addLocation?: AddLocationT
  noLocation?: boolean
  babel: Partial<TransformOptions>
}

export type AstNodeT = {
  type: string
  properties?: Array<ObjectPropertyT>
}

export type MapT<V> = {
  [key: string]: V
}

export type ObjectPropertyT = {
  key: {
    name: string
  }
}

export type TranslationConfiguration = {
  /**
   * Default language for browsers where language detection
   * failed or was unavailable.
   */
  default?: string

  /**
   * Map short-hand language keys into the respective language key
   */
  map?: {
    [key: string]: string
  }

  /**
   * Interpolation pattern for injecting values into
   * your to be translated i18n string.
   *
   * **Be aware your regex must include a regex-group**
   *
   * @default "__(\\w+)__"
   */
  interpolationPattern?: string
}
