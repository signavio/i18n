const po2json = require('po2json')

module.exports = {
  process(src, filename, config, options) {
    const messagesJson = po2json.parseFileSync(filename, { stringify: true })
    return {
      code: `module.exports=function(clb) { clb(${messagesJson}) };`,
    }
  },
}
