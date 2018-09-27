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

import { delay, defer, padLeft, formatDate } from 'src/utils'

const debug = require('debug')('bamc-cw:App')

import './App.less'

export default vnode => {
  const state = {
    commandHistory: [],
    commandHistoryIndex: null,
    prevCommand: null,

    chatBegin: false,
    lockScroll: false,
    showChat: false,
    lockChatScroll: false,

    room: {},
    emap: {},
    emapCache: {},
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

      // send messages to specific telegram channel
      if(localStorage.TELEGRAM_API_TOKEN && localStorage.TELEGRAM_CHANNEL_ID) {
        const { TELEGRAM_API_TOKEN, TELEGRAM_CHANNEL_ID } = localStorage
        const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_API_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHANNEL_ID}&text=`
        const pureLine = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
        m.request(`${TELEGRAM_URL}${encodeURIComponent(pureLine)}`)
      }

      fns.addChatLine(`[${time}]` + ansi.ansi_to_html(line))
      state.showChat = true
      state.chatBegin = false
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

  async function setScrollLockState(lock) {
    state.lockScroll = lock
  }

  async function toggleScrollLock(e) {
    e.preventDefault()
    const { lockScroll } = state
    state.lockScroll = !lockScroll
  }

  async function setChatScrollLockState(lock) {
    state.lockChatScroll = lock
  }

  async function toggleChatScrollLock(e) {
    e.preventDefault()
    const { lockChatScroll } = state
    state.lockChatScroll = !lockChatScroll
  }

  async function toggleChatView(e) {
    e.preventDefault()
    const { showChat } = state
    state.showChat = !showChat
    m.redraw()
    await delay(0)
    el.content.scrollTop = el.content.scrollHeight
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
      case 'g': {
        if(e.ctrlKey) {
          bamc.emit('action', { type: 'send', message: 'gc' })
        }
        break;
      }
      case 'c': {
        if(e.ctrlKey) {
          toggleChatView(e)
        }
        break;
      }
      case 'l': {
        if(e.ctrlKey) {
          setScrollLockState(false)
          el.input.select()
        }
        break;
      }
      default: {

      }
    }
  }

  const LineItem = {
    view: ({ attrs }) => m('div', {style: attrs.style}, m.trust(attrs.line)),
  }

  const view = () => {
    const { lockScroll, lockChatScroll } = state
    const chatViewClass = !state.showChat ? 'hide' : ''

    return m('.App', [
      m('.content', [
        m('.main-view', [
          m('.chat-view', {class: chatViewClass}, [
            m(Virtualized, {
              class: THEME,
              oncreate: vn => {
                fns.addChatLine = vn.state.addLine
              },
              lockScroll: lockChatScroll,
              renderItem: LineItem,
              requestLock: setChatScrollLockState,
            }),
            m('button', {
              type: 'button',
              onclick: toggleChatScrollLock,
            },  lockChatScroll ? m.trust('&#128274;') : m.trust('&#128275;')),
          ]),
          m('.game-view', [
            m(Virtualized, {
              class: THEME,
              oncreate: vn => {
                el.content = vn.dom
                fns.addLines = vn.state.addLines
              },
              lockScroll,
              renderItem: LineItem,
              requestLock: setScrollLockState,
            }),
          ]),
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
