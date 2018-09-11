import m from 'mithril'
import App from 'src/components/App'


function mountApplication() {
  const root = document.getElementById('app')
  m.render(root, m(App))
}

function init() {
  // TODO should/can require styles here
  mountApplication();
}

window.onload = init;

if(module.hot) {
  module.hot.accept();
  init();
}
