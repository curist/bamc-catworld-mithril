import m from 'mithril'

import connect from 'src/connect'
import { THEME } from 'src/config'

import keycode from 'keycode'
import AnsiUp from 'ansi_up'
const ansi = new AnsiUp()
ansi.use_classes = true

const debug = require('debug')('bamc-cw:App')

import './App.less'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const defer = async task => (await delay(0), task())

const MAX_LINES = 2000

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
    lines: [],
    lineIndex: 0,
    commandHistory: [],
    commandHistoryIndex: null,
    prevCommand: null,
  }

  let bufferedLines = []
  let refreshLineTimeout = null

  const el = {
    container: null,
    input: null,
  }

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
    const { container } = el

    state.lineIndex += 1
    bufferedLines.push({
      index: state.lineIndex,
      content: ansi.ansi_to_html(line),
    })

    if(refreshLineTimeout) {
      return
    }

    refreshLineTimeout = setTimeout(async () => {
      refreshLineTimeout = null
      const allLines = state.lines.concat(bufferedLines)
      bufferedLines = []

      state.lines = allLines.slice(-1 * MAX_LINES)
      m.redraw()

      // TODO use mutation observer to handle this
      await delay(0)
      if(container.scrollTop !== container.scrollHeight) {
        container.scrollTop = container.scrollHeight
      }
    }, 20)
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

  const view = () => {
    return m('.App', [
      m('.container', {
        class: THEME,
        oncreate: vn => el.container = vn.dom,
      }, state.lines.map(({ index, content }) => {
        return m('div', { key: index }, m.trust(content))
      })),
      m('form', { onsubmit: sendCommand }, [
        m('input.input', {
          oncreate: vn => el.input = vn.dom,
          onkeyup: handleSpecialKeys,
          spellcheck: false,
          autofocus: true,
        })
      ]),
    ])
  }

  return { view }
}
