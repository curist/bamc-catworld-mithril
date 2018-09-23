import m from 'mithril'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const sum = arr => arr.reduce((total, n) => total + (n || 0), 0)

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
    scroll: null,
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
    let i = 0, len = lineOffsets.length, start, end
    while(i < len && scrollTop >= lineOffsets[i++]);
    start = Math.max(0, i - 5)
    while(i < len && scrollTop < lineOffsets[i++]);
    return [start, Math.min(end + 5, lineOffsets.length - 1)]
  }

  const oncreate = async vnode => {
    await delay(0)

    const ob = new MutationObserver(async mutations => {
      if(state.lockScroll) {
        return
      }
      el.scroll.scrollTop = el.scroll.scrollHeight
    })
    ob.observe(el.content, { attributes: true })
  }

  const onupdate = vnode => {
    state.lockScroll = vnode.attrs.lockScroll
  }

  const view = () => {
    const [ start, end ] = findFirstVisibleIndexRange(state.scrollTop)
    const totalHeight = sum(lineHeights)
    return m('.virtualized', {
      class: vnode.attrs.class,
      oncreate(vnode) {
        el.scroll = vnode.dom
      },
      onscroll(e) {
        state.scrollTop = e.target.scrollTop
      },
    }, m('.wrap', {
      oncreate(vnode) {
        el.content = vnode.dom
      },
      style: {
        position: 'relative',
        height: totalHeight + 'px',
        width: '100%',
        overflow: 'hidden',
      },
    }, lines.slice(start).map(({key, line}) => {
      const i = key
      const offset = lineOffsets[i]
      if(offset !== undefined) {
        if(key > end) {
          return null
        }
        return m(renderItem, {
          key, line,
          style: {
            position: 'absolute',
            top: offset + 'px',
            width: '100%',
          },
        })
      }
      return m(renderItem, {
        key, line,
        style: {
          position: 'absolute',
          top: '-10000px',
          width: '100%',
        },
        oncreate: vnode => {
          const height = vnode.dom.clientHeight || 0
          const prevOffset = lineOffsets[i - 1] || 0
          const prevHeight = lineHeights[i - 1] || 0
          lineHeights[i] = height
          lineOffsets[i] = prevOffset + prevHeight
          m.redraw()
        },
      })
    })))
  }

  return { view, oncreate, onupdate, addLine, addLines }
}
