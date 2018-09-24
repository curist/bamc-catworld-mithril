import m from 'mithril'
import Bar from 'src/widgets/Bar'

import { padLeft } from 'src/utils'

import './HpView.less'

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
    return m('.hp-view', [
      m('.main-stats', [
        m('.title', '精氣神'),
        m('.bars', [
          m(Bar, {
            value: gin,
            maxValue: eff_gin,
            color: 'gold',
            length: 60,
          }),
          m(Bar, {
            value: kee,
            maxValue: eff_kee,
            color: 'lime',
            length: 60,
          }),
          m(Bar, {
            value: sen,
            maxValue: eff_sen,
            color: 'magenta',
            length: 60,
          })
        ]),
      ]),
      m('.main-stats-2', [
        m('.row', [
          m('.title', '靈力'),
          m('.values', [
            m('.value', {
              style: {
                color: 'gold',
              },
            }, atman),
            m('.sep', '/'),
            m('.max-value', padLeft(max_atman + '', 4)),
            m('.enforce-level', `+${atman_factor}`),
          ]),
        ]),
        m('.row', [
          m('.title', '內力'),
          m('.values', [
            m('.value', {
              style: {
                color: 'lime',
              },
            }, force),
            m('.sep', '/'),
            m('.max-value', padLeft(max_force + '', 4)),
            m('.enforce-level', `+${force_factor}`),
          ]),
        ]),
        m('.row', [
          m('.title', '法力'),
          m('.values', [
            m('.value', {
              style: {
                color: 'magenta',
              },
            }, mana),
            m('.sep', '/'),
            m('.max-value', padLeft(max_mana + '', 4)),
            m('.enforce-level', `+${force_factor}`),
          ]),
        ]),
      ]),

      m('.other-stats', [
        m('.row', [
          m('.title', '食物'),
          m(Bar, {
            value: food,
            maxValue: max_food,
            color: 'sandybrown',
            length: 120,
            horizontal: true,
          }),
        ]),
        m('.row', [
          m('.title', '飲水'),
          m(Bar, {
            value: water,
            maxValue: max_water,
            color: 'blue',
            length: 120,
            horizontal: true,
          }),
        ]),
        m('.row', [
          m('.title', '潛能'),
          m('.value', pot),
        ]),
        m('.row', [
          m('.title', '經驗'),
          m('.value', exp),
        ]),
        m('.row', [
          m('.title', '狀態'),
          m('.value', status),
        ]),
      ]),

    ])
  }

  return { view }
}
