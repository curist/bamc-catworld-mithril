import m from 'mithril'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export default function Virtualized(vnode) {
  const { renderItem } = vnode.attrs
  let lines = []
  let lineHeights = []
  let lineOffsets = []
  let dataIndex = 0

  let state = {
    scrollTop: 0,
    lockScroll: false,
  }

  let el = {
    content: null,
  }

  const addLine = line => {
    const i = dataIndex++
    lines.push({
      key: i,
      line,
    })
  }

  const addLines = lines => {
    for(let line of lines) {
      addLine(line)
    }
    m.redraw()
  }

  const StubView = {
    view: vnode => m('div', {
      class: vnode.attrs.class,
      style: {
        height: vnode.attrs.height + 'px',
        width: '100%',
        padding: '0px',
      }
    })
  }

  function findFirstVisibleIndexRange(scrollTop) {
    let i = 0, start
    while(scrollTop > lineOffsets[i++]);
    start = Math.max(0, i - 2)
    // TODO find the real start, end
    return [start, Math.min(start + 50, lineOffsets.length - 1)]
  }

  function trackAndScrollToBottom(el) {
    const ob = new MutationObserver(mutations => {
      if(state.lockScroll) {
        return
      }
      el.scrollTop = el.scrollHeight
    })
    ob.observe(el, { childList: true })
  }

  const onupdate = vnode => {
    state.lockScroll = vnode.attrs.lockScroll
  }

  const view = () => {
    const [ start, end ] = findFirstVisibleIndexRange(state.scrollTop)
    const totalHeight = lineOffsets.slice(-1)[0] + lineHeights.slice(-1)[0]
    const topStubHeight = lineOffsets[start]
    const botStubHeight = totalHeight - lineOffsets[end] - lineHeights[end]
    return m('.virtualized', {
      class: vnode.attrs.class,
      oncreate(vnode) {
        el.content = vnode.dom
        trackAndScrollToBottom(el.content)
      },
      onscroll(e) {
        state.scrollTop = e.target.scrollTop
      },
    }, [
      m(StubView, { height: topStubHeight }),
      m.fragment({}, lines.slice(start).map(({key, line}, i) => {
        return m(renderItem, {
          key, line,
          oncreate: vnode => {
            const height = vnode.dom.clientHeight || 0
            const prevOffset = lineOffsets[i - 1] || 0
            const prevHeight = lineHeights[i - 1] || 0
            lineHeights[i] = height
            lineOffsets[i] = prevOffset + prevHeight
          },
        })
      })),
      // m(StubView, { height: botStubHeight }),
    ])
  }

  return { view, onupdate, addLine, addLines }
}
