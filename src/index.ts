import m, { mount } from 'mithril'
import App from 'src/components/App'

function mountApplication() {
  const root = document.getElementById('app')
  mount(root, App)
}

function init() {
  require('src/styles.less')
  require('src/themes.less')
  mountApplication()
}

window.onload = init;

if(module.hot) {
  module.hot.accept()
  init()

  // setup debug
  localStorage.debug = 'bamc-cw:*'
}
