import m from 'mithril'

const gmcpHandlerBuilder = (bamc, state) => ({
  'auto-login.username': payload => {
    bamc.emit('action', {
      type: 'send',
      message: localStorage.user,
    })
  },
  'auto-login.password': payload => {
    bamc.emit('action', {
      type: 'send',
      message: localStorage.password,
    })
  },
  'char.id': charname => {
    bamc.emit('action', {
      type: 'cmd',
      message: 'sync_time',
    })
  },
  'char.vitals': payload => {
    state.vitals = payload
    m.redraw()
  },
  'room.location': payload => {
    state.room = payload
    if(state.emap.name == payload.map) {
      return
    }
    bamc.emit('action', {
      type: 'cmd',
      message: `load_map ${payload.map}`,
    })
    m.redraw()
  },
  'map.data': payload => {
    state.emap = payload
    m.redraw()
  },
  'channel.begin': ({type, time}) => {
    state.chatBegin = true
  },
  'channel.end': () => {
    // state.chatBegin = false
  },
})

export default gmcpHandlerBuilder
