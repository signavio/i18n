describe('extract', () => {
  describe('function name', () => {
    it('should by default extract keys from i18n calls.')
    it('should be possible to choose a custom function name')
  })

  describe('file name', () => {
    it('should by default extract to a messages.pot file')
    it('should be possible to specify an extract output file')
  })

  describe('add location', () => {
    it('should by default include the location where the message key was found')
    it('should be possible to only include the file name')
    it('should be possible to never show the location')
  })

  describe('no location', () => {
    it('should suppress locations in the .pot file completely')
  })
})
