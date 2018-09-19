import m from 'mithril'

export default function Virtualized(vnode) {
  const { renderItem } = vnode.attrs

  let _data = []
  let dataIndex = 0
  const addData = newData => {
    for(let i = 0; i < newData.length; i++) {
      let data = newData[i]
      _data.push({ key: dataIndex++, data })
    }
    m.redraw()
  }

  const view = () => {
    return m('.bamc-virtualized', {
      class: vnode.attrs.class,
    }, _data.map(({key, data}) => {
      return m(renderItem, {
        key,
        data,
      })
    }))
  }

  return { view, addData }
}
