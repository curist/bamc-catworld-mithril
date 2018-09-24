import m from 'mithril'
import Bar from 'src/widgets/Bar'

function formatPercentage(num) {
  return Math.floor(num * 100)
}

export default vnode => {

  const view = vnode => {
    const {
      gin, eff_gin, max_gin,
      atman, max_atman, atman_factor,

      kee, eff_kee, max_kee,
      force, max_force, force_factor,

      sen, eff_sen, max_sen,
      mana, max_mana, mana_factor,

      food, max_food,
      water, max_water,

      exp, pot, status,
    } = vnode.attrs
    if(!gin) {
      return
    }
    return m('ul.HpView', {
    }, [
      m('li', ['精:', gin, '/', eff_gin, `(${formatPercentage(eff_gin / max_gin)}%)`]),
      m('li', ['gin', m(Bar, {
        value: gin,
        maxValue: eff_gin,
        color: 'gold',
        length: 50,
      })]),
      m('li', ['靈力:', atman, '/', max_atman, `(+${atman_factor})`]),
      m('li', ['氣:', kee, '/', eff_kee, `(${formatPercentage(eff_kee / max_kee)}%)`]),
      m('li', ['kee', m(Bar, {
        value: kee,
        maxValue: eff_kee,
        color: 'lime',
        length: 50,
      })]),
      m('li', ['內力:', force, '/', max_force, `(+${force_factor})`]),
      m('li', ['神:', sen, '/', eff_sen, `(${formatPercentage(eff_sen / max_sen)}%)`]),
      m('li', ['sen', m(Bar, {
        value: sen,
        maxValue: eff_sen,
        color: 'magenta',
        length: 50,
      })]),
      m('li', ['法力:', mana, '/', max_mana, `(+${mana_factor})`]),
      m('li', ['食物:', food, '/', max_food]),
      m('li', m(Bar, {
        value: food,
        maxValue: max_food,
        color: 'peru',
        length: 60,
        horizontal: true,
      })),
      m('li', ['飲水:', water, '/', max_water]),
      m('li', m(Bar, {
        value: water,
        maxValue: max_water,
        color: 'aqua',
        length: 60,
        horizontal: true,
      })),
      m('li', ['潛能:', pot]),
      m('li', ['經驗:', exp]),
      m('li', ['狀態:', status]),
    ])
  }

  return { view }
}
