import m from 'mithril'
import './Bar.less'

export default {
  view(vnode) {
    const { value, maxValue, length, color } = vnode.attrs
    const { horizontal } = vnode.attrs
    const barLen = Math.floor(Math.min(1, value / maxValue) * length)
    const orientationKey = horizontal ? 'width' : 'height'
    return m('.bar-widget', {
      class: horizontal ? 'horizontal': '',
      title: `${value} / ${maxValue}`,
      style: {
        [orientationKey]: `${length + 2}px`,
      },
    }, m('.bar-value', {
      style: {
        [orientationKey]: `${barLen}px`,
        backgroundColor: color,
      },
    }))
  },
}
