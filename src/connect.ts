import Bamc from 'bamc-core'
import { URL } from 'src/config'

const debug = require('debug')('bamc-cw:connect')

export default function() {
  const bamc = Bamc(URL)

  bamc.on('iac:sub', async ({option, buffer}) => {
    debug('iac:sub', option)
    debug('iac:sub', buffer)
  })
  bamc.on('iac:sub:gmcp', async buffer => {
    const str = buffer.toString()
    const spaceIndex = str.indexOf(' ')
    if(spaceIndex == -1) {
      bamc.emit('bamc-cw:gmcp', {
        name: str,
        payload: null,
      })
      return
    }
    const name = str.slice(0, spaceIndex)
    const payload = str.slice(spaceIndex + 1)

    if(name == 'char.id') {
      return bamc.emit('bamc-cw:gmcp', {
        name,
        payload,
      })
    }
    return bamc.emit('bamc-cw:gmcp', {
      name,
      payload: JSON.parse(payload),
    })
  })

  return bamc
}
