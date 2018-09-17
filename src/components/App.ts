import m from 'mithril'

import connect from 'src/connect'
import { THEME } from 'src/config'

import keycode from 'keycode'
import AnsiUp from 'ansi_up'
const ansi = new AnsiUp()
ansi.use_classes = true

import Clusterize from 'clusterize.js'

const debug = require('debug')('bamc-cw:App')

import './App.less'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const defer = async task => (await delay(0), task())

const gmcpHandlerBuilder = bamc => ({
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
})

export default (vnode) => {
  const state = {
    commandHistory: [],
    commandHistoryIndex: null,
    prevCommand: null,
    shouldScroll: false,
    lockScroll: false,
  }

  let bufferedLines = []
  let refreshLineTimeout = null

  const el = {
    scroll: null,
    container: null,
    input: null,
  }

  let clusterize = null

  const bamc = connect()
  bamc.on('line', updateLine)

  bamc.on('iac:sub', payload => debug(payload))

  const gmcpHandlers = gmcpHandlerBuilder(bamc)
  bamc.on('bamc-cw:gmcp', async ({ name, payload }) => {
    debug(name, payload)
    const handler = gmcpHandlers[name]
    if(!handler) {
      return
    }
    handler(payload)
  })

  async function updateLine(line) {
    const { scroll } = el

    const markup = `<div>${ansi.ansi_to_html(line)}</div>`
    bufferedLines.push(markup)

    if(refreshLineTimeout) {
      return
    }

    refreshLineTimeout = setTimeout(async () => {
      refreshLineTimeout = null

      if(state.lockScroll) {
        return
      }
      state.shouldScroll = true
      clusterize.append(bufferedLines)
      bufferedLines = []
    }, 20)
  }

  async function toggleScrollLock(e) {
    e.preventDefault()
    const { lockScroll } = state
    state.lockScroll = !lockScroll

    // previously locked, should update buffer
    if( lockScroll ) {
      state.shouldScroll = true
      clusterize.append(bufferedLines)
      bufferedLines = []
    }
  }

  async function sendCommand(e) {
    e.preventDefault()
    const { commandHistory, prevCommand } = state
    const cmd = el.input.value || ' '

    // focus input after command sent
    defer(() => el.input.select())

    if(/^:/.test(cmd)) {
      bamc.emit('action', { type: 'cmd', message: cmd.slice(1) })
      el.input.value = prevCommand || ''
      return
    }

    bamc.emit('action', { type: 'send', message: cmd })

    if(cmd == prevCommand) {
      return
    }

    state.commandHistoryIndex= commandHistory.length
    state.commandHistory= commandHistory.concat([cmd]).slice(-50)
    state.prevCommand= cmd
  }

  async function handleSpecialKeys(e) {
    const { commandHistory, commandHistoryIndex } = state
    const maxIndex = commandHistory.length - 1
    const i = commandHistoryIndex == null
      ? maxIndex :  commandHistoryIndex

    switch(keycode(e)) {
      case 'up': {
        const nextCmdHistoryIndex = Math.max(0, i - 1)
        const cmd = commandHistory[nextCmdHistoryIndex]
        el.input.value = cmd
        el.input.select()
        state.commandHistoryIndex = nextCmdHistoryIndex
        break
      }
      case 'down': {
        const nextCmdHistoryIndex = Math.min(maxIndex, i + 1)
        const cmd = commandHistory[nextCmdHistoryIndex]
        el.input.value = cmd
        el.input.select()
        state.commandHistoryIndex = nextCmdHistoryIndex
        break
      }
      default: {

      }
    }
  }

  const oncreate = async vn => {
    // defer to wait for other dom nodes refs
    await delay(0)
    const { scroll } = el
    clusterize = new Clusterize({
      scrollElem: el.scroll,
      contentElem: el.container,
      callbacks: {
        clusterChanged: async () => {
          if(!state.shouldScroll) {
            return
          }
          state.shouldScroll = false

          await delay(50)
          scroll.scrollTop = scroll.scrollHeight
        },
      },
    })
  }

  const view = () => {
    const { lockScroll } = state
    return m('.App', [
      m('.clusterize-scroll', {
        oncreate: vn => el.scroll = vn.dom,
      }, [
        m('.container.clusterize-content', {
          class: THEME,
          oncreate: vn => el.container = vn.dom,
        }),
      ]),
      m('form', { onsubmit: sendCommand }, [
        m('input.input', {
          oncreate: vn => el.input = vn.dom,
          onkeyup: handleSpecialKeys,
          spellcheck: false,
          autofocus: true,
        }),
        m('button', {
          type: 'button',
          onclick: toggleScrollLock,
        }, lockScroll
          ? m.trust('&#128274;')
          : m.trust('&#128275;')
        ),
      ]),
    ])
  }

  return { view, oncreate }
}
