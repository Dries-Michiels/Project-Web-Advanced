import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'
import Router from './router.js'

const routes = {
  '/': (rootElement) => {
    rootElement.innerHTML = '<h1>Home</h1>';
  },
  '/about': (rootElement) => {
    rootElement.innerHTML = '<h1>About</h1>';
  },
  '/contact': (rootElement) => {
    rootElement.innerHTML = '<h1>Contact</h1>';
  },
  '/404': (rootElement) => {
    rootElement.innerHTML = '<h1>404 Not Found</h1>';
  }
};

new Router(routes);


document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`

setupCounter(document.querySelector('#counter'))
