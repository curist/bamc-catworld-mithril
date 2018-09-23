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
    console.log(vnode.attrs.room)
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
          console.log(i, j)
          marginLeft = -1 * (j * 12 + 6) + 125 + 'px'
          marginTop = -1 * (i * 12 + 18) + 125 + 'px'
          console.log(marginLeft, marginTop)
          break
        }
      }
    }
    return m('.emap', [
      m('.title', [ mapLocation, name, title, code ]),
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
          return m('.node', {
            class: active,
            title: v,
          }, displayName)
        }))
      }))
    ])
  }

  return { view }
}
