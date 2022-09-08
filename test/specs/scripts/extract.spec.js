import childProcess from 'child_process'
import { existsSync, unlinkSync, readFileSync } from 'fs'

const fixtureDir = `${process.cwd()}/test/fixtures`

const removeIfExists = fileName => {
  if (existsSync(fileName)) {
    unlinkSync(fileName)
  }
}

const callForDir = dirName => {
  childProcess.execSync(
    `node ${process.cwd()}/bin/i18n-extract.js "${dirName}/**/*.js"`
  )
}

const callForDirReplacements = dirName => {
  childProcess.execSync(
    `node ${process.cwd()}/bin/i18n-extract.js "${dirName}/**/*.js" ${dirName}/messages.pot} ${dirName}/replacements.json`
  )
}

describe('extract', () => {
  describe('function name', () => {
    const customFunctionNameDir = `${fixtureDir}/customFunctionName`

    afterEach(() => {
      removeIfExists(`${customFunctionNameDir}/messages.pot`)
    })

    it('should be possible to choose a custom function name', () => {
      expect(existsSync(`${customFunctionNameDir}/messages.pot`)).toBeFalsy()

      callForDir(customFunctionNameDir)

      expect(existsSync(`${customFunctionNameDir}/messages.pot`)).toBeDefined()
      
      const messages = readFileSync(`${customFunctionNameDir}/messages.pot`).toString("utf-8")

      expect(messages).toContain('msgid "Hello World"')
      expect(messages).not.toContain('msgid "Not in the result"')
    })
  })

  describe('replacements', () => {
    const replacementsDir = `${fixtureDir}/replacements`

    afterEach(() => {
      removeIfExists(`${replacementsDir}/messages.pot`)
    })

    it('should be possible to add replacement translations based on the replacements json', () => {
      expect(existsSync(`${replacementsDir}/messages.pot`)).toBeFalsy()

      callForDirReplacements(replacementsDir)

      expect(existsSync(`${replacementsDir}/messages.pot`)).toBeDefined()
      
      const messages = readFileSync(`${replacementsDir}/messages.pot`).toString("utf-8")

      expect(messages).toContain('msgid "Needs replacement"')
      expect(messages).toContain(`msgid "A replacement for 'Needs replacement'`)
      expect(messages).toContain('#. REPLACEMENT for "Needs replacement"')
      expect(messages).toContain('msgid "No replacement is needed"')

      // context
      expect(messages).toContain(
        [
          `#: fixtures/replacements/index.js:3`,
          `#. REPLACEMENT for "Needs replacement", context: someContext`,
          `msgctxt "someContext"`,
          `msgid "A replacement for 'Needs replacement'"`,
        ].join('\n')
      )

      // context plural
      expect(messages).toContain(
        [
          `#: fixtures/replacements/index.js:5`,
          `msgctxt "anotherContext"`,
          `msgid "Needs replacement plural 1"`,
          `msgid_plural "Needs replacement plural 2"`,
        ].join('\n')
      )
    })
  })
  
  describe('file name', () => {
    const customFileNameDir = `${fixtureDir}/customFileName`

    afterEach(() => {
      removeIfExists(`${customFileNameDir}/my-custom-messages.pot`)
    })

    it('should be possible to specify an extract output file', () => {
      expect(existsSync(`${customFileNameDir}/my-custom-messages.pot`)).toBeFalsy()

      callForDir(customFileNameDir)

      expect(existsSync(`${customFileNameDir}/my-custom-messages.pot`)).toBeDefined()

      const messages = readFileSync(`${customFileNameDir}/my-custom-messages.pot`).toString("utf-8")
      expect(messages).toBeDefined()
      expect(messages).toContain('msgid "Hello World"')
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

    it(
      'should by default include the location where the message key was found',
      () => {
        expect(existsSync(`${defaultDir}/messages.pot`)).toBeFalsy()
        callForDir(defaultDir)
        expect(existsSync(`${defaultDir}/messages.pot`)).toBeDefined()

        const messages = readFileSync(`${defaultDir}/messages.pot`).toString("utf-8")
        
        const referencePath = 'fixtures/addLocation/default'
        expect(messages).toBeDefined()
        expect(messages).toContain(`#: ${referencePath}/index.js:1`)
      }
    )

    it(
      'should be possible to explicitly state that you want the full path',
      () => {
        expect(existsSync(`${fullDir}/messages.pot`)).toBeFalsy()
        
        callForDir(fullDir)
        expect(existsSync(`${fullDir}/messages.pot`)).toBeDefined()

        const messages = readFileSync(`${fullDir}/messages.pot`).toString("utf-8")
        const referencePath = 'fixtures/addLocation/full'

        expect(messages).toBeDefined()
        expect(messages).toContain(`#: ${referencePath}/index.js:1`)
      }
    )

    it('should be possible to only include the file name', () => {
      expect(existsSync(`${fileDir}/messages.pot`)).toBeFalsy()
      
      callForDir(fileDir)
      expect(existsSync(`${fileDir}/messages.pot`)).toBeDefined()

      const messages = readFileSync(`${fileDir}/messages.pot`).toString("utf-8")

      expect(messages).toBeDefined()
      expect(messages).toContain('#: index.js:1')
    })

    it('should be possible to never show the location', () => {
      expect(existsSync(`${neverDir}/messages.pot`)).toBeFalsy()
      
      callForDir(neverDir)
      expect(existsSync(`${neverDir}/messages.pot`)).toBeDefined()

      const messages = readFileSync(`${neverDir}/messages.pot`).toString('utf-8')

      expect(messages).toBeDefined()
      expect(messages).not.toContain(`#: ${neverDir}/index.js:1`)
      expect(messages).not.toContain('#: index.js:1')
    })
  })

  describe('no location', () => {
    const noLocationDir = `${fixtureDir}/noLocation`

    afterEach(() => {
      removeIfExists(`${noLocationDir}/messages.pot`)
    })

    it('should suppress locations in the .pot file completely', () => {
      expect(existsSync(`${noLocationDir}/messages.pot`)).toBeFalsy()
      
      callForDir(noLocationDir)
      expect(existsSync(`${noLocationDir}/messages.pot`)).toBeDefined()

      const messages = readFileSync(`${noLocationDir}/messages.pot`).toString("utf-8")

      expect(messages).toBeDefined()
      expect(messages).not.toContain(`#: ${noLocationDir}/index.js:1`)
    })
  })

  describe('message context', () => {
    const contextLocation = `${fixtureDir}/messageContext`

    afterEach(() => {
      removeIfExists(`${contextLocation}/messages.pot`)
    })

    it('should add the message context to the .pot file', () => {
      expect(existsSync(`${contextLocation}/messages.pot`)).toBeFalsy()
      
      callForDir(contextLocation)
      expect(existsSync(`${contextLocation}/messages.pot`)).toBeDefined()

      const messages = readFileSync(`${contextLocation}/messages.pot`).toString("utf-8")

      expect(messages).toBeDefined()
      expect(messages).toContain('msgctxt "This is context for my message"')
    })
  })

  describe('extracted comment', () => {
    const extractedCommentLocation = `${fixtureDir}/extractedComment`

    afterEach(() => {
      removeIfExists(`${extractedCommentLocation}/messages.pot`)
    })

    it('should add the extracted comment correctly to the .pot file', () => {
      expect(existsSync(`${extractedCommentLocation}/messages.pot`)).toBeFalsy()
      
      callForDir(extractedCommentLocation)
      expect(existsSync(`${extractedCommentLocation}/messages.pot`)).toBeDefined()

      const messages = readFileSync(`${extractedCommentLocation}/messages.pot`).toString('utf-8')

      expect(messages).toBeDefined()
      expect(messages).toContain('#. This is a comment for the translators')
    })
  })

  describe('babel', () => {
    const flowLocation = `${fixtureDir}/withFlowAnnotations`

    afterEach(() => {
      removeIfExists(`${flowLocation}/messages.pot`)
    })

    it('should be possible to load extra plugins.', () => {
      expect(existsSync(`${flowLocation}/messages.pot`)).toBeFalsy()
      
      callForDir(flowLocation)
      expect(existsSync(`${flowLocation}/messages.pot`)).toBeDefined()

      const messages = readFileSync(`${flowLocation}/messages.pot`).toString('utf-8')

      expect(messages).toBeDefined()
      expect(messages).toContain('msgid "I got extracted"')
    })
  })

  describe('includes message from multiple files', () => {
    const multipleFilesLocation = `${fixtureDir}/multipleFiles`
    afterEach(() => {
      removeIfExists(`${multipleFilesLocation}/messages.pot`)
    })
    it('should have message from two files', () => {
      expect(existsSync(`${multipleFilesLocation}/messages.pot`)).toBeFalsy()
      callForDir(multipleFilesLocation)
      expect(existsSync(`${multipleFilesLocation}/messages.pot`)).toBeDefined()

      const messages = readFileSync(`${multipleFilesLocation}/messages.pot`).toString("utf-8")

      expect(messages).toBeDefined()
      expect(messages).toContain('msgid "Hello"')
      expect(messages).toContain('msgid "World"')
    })
  })
})
