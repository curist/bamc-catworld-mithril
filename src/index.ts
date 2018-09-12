import m, { mount } from 'mithril'
import App from 'src/components/App'

function mountApplication() {
  const root = document.getElementById('app')
  mount(root, App)
}

function init() {
  // TODO should/can require styles here
  require('src/styles.less')
  mountApplication()
}

window.onload = init;

if(module.hot) {
  module.hot.accept()
  init()

  // setup debug
  localStorage.debug = 'bamc-cw:*'
}
