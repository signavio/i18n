import childProcess from 'child_process'
import { existsSync, unlinkSync } from 'fs'
import { file } from 'chai-files'
import { expect } from 'chai'

const fixtureDir = `${process.cwd()}/test/fixtures`

const removeIfExists = (fileName) => {
  if (existsSync(fileName)) {
    unlinkSync(fileName)
  }
}

const callForDir = (dirName) => {
  childProcess.execSync(`node ${process.cwd()}/bin/i18n-extract.js "${dirName}/**/*.js"`)
}

describe('extract', () => {
  describe('function name', () => {
    const customFunctionNameDir = `${fixtureDir}/customFunctionName`

    afterEach(() => {
      removeIfExists(`${customFunctionNameDir}/messages.pot`)
    })

    it('should be possible to choose a custom function name', () => {
      expect(file(`${customFunctionNameDir}/messages.pot`)).to.not.exist

      callForDir(customFunctionNameDir)

      const messages = file(`${customFunctionNameDir}/messages.pot`)

      expect(messages).to.exist
      expect(messages).to.contain('msgid "Hello World"')
      expect(messages).to.not.contain('msgid "Not in the result"')
    })
  })

  describe('file name', () => {
    const customFileNameDir = `${fixtureDir}/customFileName`

    afterEach(() => {
      removeIfExists(`${customFileNameDir}/my-custom-messages.pot`)
    })

    it('should be possible to specify an extract output file', () => {
      expect(file(`${customFileNameDir}/my-custom-messages.pot`)).to.not.exist

      callForDir(customFileNameDir)

      const messages = file(`${customFileNameDir}/my-custom-messages.pot`)

      expect(messages).to.exist
      expect(messages).to.contain('msgid "Hello World"')
    })
  })

  describe('add location', () => {
    const addLocationDir = `${fixtureDir}/addLocation`

    const fullDir = `${addLocationDir}/full`
    const fileDir = `${addLocationDir}/file`
    const neverDir = `${addLocationDir}/never`
    const defaultDir = `${addLocationDir}/default`

    afterEach(() => {
      removeIfExists(`${fullDir}/messages.pot`)
      removeIfExists(`${fileDir}/messages.pot`)
      removeIfExists(`${neverDir}/messages.pot`)
      removeIfExists(`${defaultDir}/messages.pot`)
    })

    it('should by default include the location where the message key was found', () => {
      expect(file(`${defaultDir}/messages.pot`)).to.not.exist

      callForDir(defaultDir)

      const messages = file(`${defaultDir}/messages.pot`)

      expect(messages).to.exist
      expect(messages).to.contain(`#: ${defaultDir}/index.js:1`)
    })

    it('should be possible to explicitly state that you want the full path', () => {
      expect(file(`${fullDir}/messages.pot`)).to.not.exist

      callForDir(fullDir)

      const messages = file(`${fullDir}/messages.pot`)

      expect(messages).to.exist
      expect(messages).to.contain(`#: ${fullDir}/index.js:1`)
    })

    it('should be possible to only include the file name', () => {
      expect(file(`${fileDir}/messages.pot`)).to.not.exist

      callForDir(fileDir)

      const messages = file(`${fileDir}/messages.pot`)

      expect(messages).to.exist
      expect(messages).to.contain('#: index.js:1')
    })

    it('should be possible to never show the location', () => {
      expect(file(`${neverDir}/messages.pot`)).to.not.exist

      callForDir(neverDir)

      const messages = file(`${neverDir}/messages.pot`)

      expect(messages).to.exist
      expect(messages).to.not.contain(`#: ${neverDir}/index.js:1`)
      expect(messages).to.not.contain('#: index.js:1')
    })
  })

  describe('no location', () => {
    const noLocationDir = `${fixtureDir}/noLocation`

    afterEach(() => {
      removeIfExists(`${noLocationDir}/messages.pot`)
    })

    it('should suppress locations in the .pot file completely', () => {
      expect(file(`${noLocationDir}/messages.pot`)).to.not.exist

      callForDir(noLocationDir)

      const messages = file(`${noLocationDir}/messages.pot`)

      expect(messages).to.exist
      expect(messages).to.not.contain(`#: ${noLocationDir}/index.js:1`)
    })
  })
})
