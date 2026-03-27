import logger from '../lib/logger'
import emitter from '../lib/emitter'
import i18n from '../lib/i18n'
import Url from 'licia/Url'
import now from 'licia/now'
import startWith from 'licia/startWith'
import $ from 'licia/$'
import upperFirst from 'licia/upperFirst'
import loadJs from 'licia/loadJs'
import trim from 'licia/trim'
import LunaModal from 'luna-modal'
import { isErudaEl } from '../lib/util'
import evalCss from '../lib/evalCss'

let style = null

export default [
  {
    name: i18n.t('snippets.borderAll'),
    fn() {
      if (style) {
        evalCss.remove(style)
        style = null
        return
      }

      style = evalCss(
        '* { outline: 2px dashed #707d8b; outline-offset: -3px; }',
        document.head
      )
    },
    desc: i18n.t('snippets.borderAllDesc'),
  },
  {
    name: i18n.t('snippets.refreshPage'),
    fn() {
      const url = new Url()
      url.setQuery('timestamp', now())

      window.location.replace(url.toString())
    },
    desc: i18n.t('snippets.refreshPageDesc'),
  },
  {
    name: i18n.t('snippets.searchText'),
    fn() {
      LunaModal.prompt(i18n.t('snippets.enterText')).then((keyword) => {
        if (!keyword || trim(keyword) === '') {
          return
        }

        search(keyword)
      })
    },
    desc: i18n.t('snippets.searchTextDesc'),
  },
  {
    name: i18n.t('snippets.editPage'),
    fn() {
      const body = document.body

      body.contentEditable = body.contentEditable !== 'true'
    },
    desc: i18n.t('snippets.editPageDesc'),
  },
  {
    name: i18n.t('snippets.fitScreen'),
    // https://achrafkassioui.com/birdview/
    fn() {
      const body = document.body
      const html = document.documentElement
      const $body = $(body)
      if ($body.data('scaled')) {
        window.scrollTo(0, +$body.data('scaled'))
        $body.rmAttr('data-scaled')
        $body.css('transform', 'none')
      } else {
        const documentHeight = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        )
        const viewportHeight = Math.max(
          document.documentElement.clientHeight,
          window.innerHeight || 0
        )
        const scaleVal = viewportHeight / documentHeight
        $body.css('transform', `scale(${scaleVal})`)
        $body.data('scaled', window.scrollY)
        window.scrollTo(0, documentHeight / 2 - viewportHeight / 2)
      }
    },
    desc: i18n.t('snippets.fitScreenDesc'),
  },
  {
    name: i18n.t('snippets.loadVuePlugin'),
    fn() {
      loadPlugin('vue')
    },
    desc: i18n.t('snippets.loadVuePluginDesc'),
  },
  {
    name: i18n.t('snippets.loadMonitorPlugin'),
    fn() {
      loadPlugin('monitor')
    },
    desc: i18n.t('snippets.loadMonitorPluginDesc'),
  },
  {
    name: i18n.t('snippets.loadFeaturesPlugin'),
    fn() {
      loadPlugin('features')
    },
    desc: i18n.t('snippets.loadFeaturesPluginDesc'),
  },
  {
    name: i18n.t('snippets.loadTimingPlugin'),
    fn() {
      loadPlugin('timing')
    },
    desc: i18n.t('snippets.loadTimingPluginDesc'),
  },
  {
    name: i18n.t('snippets.loadCodePlugin'),
    fn() {
      loadPlugin('code')
    },
    desc: i18n.t('snippets.loadCodePluginDesc'),
  },
  {
    name: i18n.t('snippets.loadBenchmarkPlugin'),
    fn() {
      loadPlugin('benchmark')
    },
    desc: i18n.t('snippets.loadBenchmarkPluginDesc'),
  },
  {
    name: i18n.t('snippets.loadGeolocationPlugin'),
    fn() {
      loadPlugin('geolocation')
    },
    desc: i18n.t('snippets.loadGeolocationPluginDesc'),
  },
  {
    name: i18n.t('snippets.loadOrientationPlugin'),
    fn() {
      loadPlugin('orientation')
    },
    desc: i18n.t('snippets.loadOrientationPluginDesc'),
  },
  {
    name: i18n.t('snippets.loadTouchesPlugin'),
    fn() {
      loadPlugin('touches')
    },
    desc: i18n.t('snippets.loadTouchesPluginDesc'),
  },
]

evalCss(require('./searchText.scss'), document.head)

function search(text) {
  const root = document.body
  const regText = new RegExp(text, 'ig')

  traverse(root, (node) => {
    const $node = $(node)

    if (!$node.hasClass('eruda-search-highlight-block')) return

    return document.createTextNode($node.text())
  })

  traverse(root, (node) => {
    if (node.nodeType !== 3) return

    let val = node.nodeValue
    val = val.replace(
      regText,
      (match) => `<span class="eruda-keyword">${match}</span>`
    )
    if (val === node.nodeValue) return

    const $ret = $(document.createElement('div'))

    $ret.html(val)
    $ret.addClass('eruda-search-highlight-block')

    return $ret.get(0)
  })
}

function traverse(root, processor) {
  const childNodes = root.childNodes

  if (isErudaEl(root)) return

  for (let i = 0, len = childNodes.length; i < len; i++) {
    const newNode = traverse(childNodes[i], processor)
    if (newNode) root.replaceChild(newNode, childNodes[i])
  }

  return processor(root)
}

function loadPlugin(name) {
  const globalName = 'eruda' + upperFirst(name)
  if (window[globalName]) return

  let protocol = location.protocol
  if (!startWith(protocol, 'http')) protocol = 'http:'

  loadJs(
    `${protocol}//cdn.jsdelivr.net/npm/eruda-${name}@${pluginVersion[name]}`,
    (isLoaded) => {
      if (!isLoaded || !window[globalName])
        return logger.error(i18n.t('snippets.failToLoadPlugin') + name)

      emitter.emit(emitter.ADD, window[globalName])
      emitter.emit(emitter.SHOW, name)
    }
  )
}

const pluginVersion = {
  monitor: '1.1.1',
  features: '2.1.0',
  timing: '2.0.1',
  code: '2.2.0',
  benchmark: '2.0.1',
  geolocation: '2.1.0',
  orientation: '2.1.1',
  touches: '2.1.0',
  vue: '1.1.1',
}
