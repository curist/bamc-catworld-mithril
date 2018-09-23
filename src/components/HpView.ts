import m from 'mithril'

const foo = `
  精：  148/  148 (100%)    靈力：    0 /    0 (+0)
  氣：  256/  256 (100%)    內力：  160 /  160 (+10)
  神：  118/  118 (100%)    法力：    0 /    0 (+0)
  食物：   43/  600         潛能： 6
  飲水：   63/  600         經驗： 36
  目前狀態:  正常
  atman: 0
  atman_factor: 0
  eff_gin: 148
  eff_kee: 256
  eff_sen: 118
  exp: 36
  food: 40
  force: 160
  force_factor: 10
  gin: 148
  kee: 256
  mana: 0
  mana_factor: 0
  max_atman: 0
  max_food: 600
  max_force: 160
  max_gin: 148
  max_kee: 256
  max_mana: 0
  max_sen: 118
  max_water: 600
  pot: 6
  sen: 118
  status: " 正常"
  water: 60
`

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
      m('li', ['靈力:', atman, '/', max_atman, `(+${atman_factor})`]),
      m('li', ['氣:', kee, '/', eff_kee, `(${formatPercentage(eff_kee / max_kee)}%)`]),
      m('li', ['內力:', force, '/', max_force, `(+${force_factor})`]),
      m('li', ['神:', sen, '/', eff_sen, `(${formatPercentage(eff_sen / max_sen)}%)`]),
      m('li', ['法力:', mana, '/', max_mana, `(+${mana_factor})`]),
      m('li', ['食物:', food, '/', max_food]),
      m('li', ['飲水:', water, '/', max_water]),
      m('li', ['潛能:', pot]),
      m('li', ['經驗:', exp]),
      m('li', ['狀態:', status]),
    ])
  }

  return { view }
}
