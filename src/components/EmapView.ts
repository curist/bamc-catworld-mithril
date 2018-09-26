import m from 'mithril'
import './EmapView.less'

export default () => {
  const view = vnode => {
    const {
      room: {
        code,
        map: mapLocation,
      },
      emap: {
        title,
        name,
        param,
        map: mapData,
      },
    } = vnode.attrs
    if(!title || !mapData) {
      return m('.emap', 'no map data')
    }
    if(mapLocation != name) {
      return m('.emap', 'map data mismatch')
    }
    let marginLeft = '0px', marginTop = '0px'
    for(let i = 0; i < mapData.length; i++) {
      const rowData = mapData[i]
      for(let j = 0; j < rowData.length; j++) {
        const v = rowData[j]
        if(v == code) {
          marginLeft = -1 * (j * 14 + 7) + 150 + 'px'
          marginTop = -1 * (i * 14 + 21) + 150 + 'px'
          break
        }
      }
    }
    return m('.emap', [
      m('.title', [ title, m('.sub-title', `${name}.${code}`) ]),
      m('.wrapper', {
        style: {
          marginTop, marginLeft,
        },
      },  mapData.map((data, i) => {
        return m('.row', data.map(v => {
          const active = code == v ? 'active' : ''
          if(typeof v == 'number') {
            return m('.node', String.fromCharCode(v))
          }
          const displayName = param[v] && param[v].dn || '□'
          const className = param[v] && (param[v].cn ? 'highlight' : '')
          return m('.node', {
            class: `${active} ${className}`,
            title: v,
          }, displayName)
        }))
      }))
    ])
  }

  return { view }
}
