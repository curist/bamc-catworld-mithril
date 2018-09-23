import m from 'mithril'

import connect from 'src/connect'
import gmcpHandlerBuilder from 'src/gmcpHandlerBuilder'
import { THEME } from 'src/config'

import keycode from 'keycode'
import AnsiUp from 'ansi_up'
const ansi = new AnsiUp()
ansi.use_classes = true

import Virtualized from 'src/widgets/Virtualized'
import EmapView from 'src/components/EmapView'
import HpView from 'src/components/HpView'

const debug = require('debug')('bamc-cw:App')

import './App.less'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const defer = async task => (await delay(0), task())

const padLeft = (s='', len=0, pad=' ') => {
  const sLen = s.length
  if(sLen > len) {
    return s
  }
  return Array.from({length: len - sLen}).fill(pad).join('') + s
}

const formatDate = date => {
  const h = padLeft('' + date.getHours(), 2, '0')
  const m = padLeft('' + date.getMinutes(), 2, '0')
  const s = padLeft('' + date.getSeconds(), 2, '0')
  return `${h}:${m}:${s}`
}

export default vnode => {
  const state = {
    commandHistory: [],
    commandHistoryIndex: null,
    prevCommand: null,

    chatBegin: false,
    lockScroll: false,
    showChat: false,

    room: {},
    emap: {},
    vitals: {},
  }

  let bufferedLines = []
  let refreshLineTimeout = null

  const el = {
    content: null,
    input: null,
  }

  const fns = {
    addLines: null,
    addChatLine: null,
  }

  const bamc = connect()
  bamc.on('line', updateLine)

  bamc.on('iac:sub', payload => debug(payload))

  const gmcpHandlers = gmcpHandlerBuilder(bamc, state)
  bamc.on('bamc-cw:gmcp', async ({ name, payload }) => {
    const handler = gmcpHandlers[name]
    if(!handler) {
      debug(name, payload)
      return
    }
    handler(payload)
  })

  bamc.on('iac:do', v => {
    if(v !== 91) {
      return
    }
    bamc.emit('action', {
      type: 'raw',
      bytes: [255, 251, 91],
    })
  })
  bamc.on('iac:will', v => {
    if(v !== 201) {
      return
    }
    bamc.emit('action', {
      type: 'raw',
      bytes: [255, 253, 201],
    })
  })

  async function updateLine(line) {
    if(state.chatBegin) {
      const date = new Date
      const time = formatDate(date)

      fns.addChatLine(`[${time}]` + ansi.ansi_to_html(line))
      state.showChat = true
      state.chatBegin = false
      defer(() => el.content.scrollTop = el.content.scrollHeight)
    }
    bufferedLines.push(ansi.ansi_to_html(line))

    if(refreshLineTimeout) {
      return
    }

    refreshLineTimeout = setTimeout(async () => {
      refreshLineTimeout = null

      fns.addLines(bufferedLines)
      bufferedLines = []
    }, 20)
  }

  async function toggleScrollLock(e) {
    e.preventDefault()
    const { lockScroll } = state
    state.lockScroll = !lockScroll
  }

  function toggleChatView(e) {
    e.preventDefault()
    const { showChat } = state
    state.showChat = !showChat
    m.redraw()
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
      case 'c': {
        if(e.ctrlKey) {
          toggleChatView(e)
        }
        break;
      }
      default: {

      }
    }
  }

  const LineItem = {
    view: ({ attrs }) => m('div', attrs, m.trust(attrs.line)),
  }

  const view = () => {
    const { lockScroll } = state
    const chatViewClass = !state.showChat ? 'hide' : ''

    return m('.App', [
      m('.content', [
        m('.main-view', [
          m(Virtualized, {
            class: `${THEME} chat-view ${chatViewClass}`,
            oncreate: vn => {
              fns.addChatLine = vn.state.addLine
            },
            renderItem: LineItem,
          }),
          m(Virtualized, {
            class: `${THEME} container`,
            oncreate: vn => {
              el.content = vn.dom
              fns.addLines = vn.state.addLines
            },
            lockScroll,
            renderItem: LineItem,
          }),
        ]),
        m('.side-view', [
          m(EmapView, {
            room: state.room,
            emap: state.emap,
          }),
          m(HpView, state.vitals),
        ]),
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
        }, lockScroll ? m.trust('&#128274;') : m.trust('&#128275;')),
        m('button', {
          type: 'button',
          onclick: toggleChatView,
        }, m.trust('&#128172;')),
      ]),
    ])
  }

  return { view }
}
