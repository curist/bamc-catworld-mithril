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
    if(state.lockScroll !==vnode.attrs.lockScroll) {
      state.lockScroll = vnode.attrs.lockScroll
      if(!state.lockScroll) {
        el.scroll.scrollTop = el.scroll.scrollHeight
      }
    }
  }

  const view = vnode => {
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
        overflow: 'hidden',
        width: '100%',
        height: totalHeight + 'px',
      },
    }, lines.slice(start).map(({key, line}) => {
      const i = key
      const offset = lineOffsets[i]

      // already measured
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
      // render measurement dom node
      return m(renderItem, {
        key, line,
        style: {
          position: 'absolute',
          top: '-10000px',
          width: '100%',
        },
        oncreate: vnode => {
          let MIN_HEIGHT = Math.min.apply(null, lineHeights.slice(0, 3).concat([0]))
          const height = vnode.dom.clientHeight || MIN_HEIGHT
          const prevHeight = lineHeights[i - 1] || MIN_HEIGHT
          const prevOffset = lineOffsets[i - 1] !== undefined 
            ? lineOffsets[i - 1]
            : totalHeight

          lineHeights[i] = height
          lineOffsets[i] = prevOffset + prevHeight
          m.redraw()
        },
      })
    })))
  }

  return { view, oncreate, onupdate, addLine, addLines }
}
