import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
const source = await readFile(new URL('../desktop/plugin.js', import.meta.url), 'utf8')
// SDK double; real React rendering, not real clipboard or native-browser acceptance.
async function load({ locale = 'en', saved, storageFails = false, clipboard = async () => true } = {}) {
  const copies = [], writes = [], notices = [], disposers = [], contributions = []
  let bundles = {}
  const t = key => bundles[locale]?.[key] ?? bundles.en?.[key] ?? key
  const wrap = tag => ({ children }) => React.createElement(tag, null, children)
  const sdk = {
    Button: wrap('button'), Codicon: wrap('span'),
    Switch: props => React.createElement('button', { role: 'switch', 'aria-checked': props.checked }),
    MessageTextContent: ({ text }) => React.createElement('span', { 'data-preview-markdown': text }),
    Popover: wrap('div'), PopoverContent: wrap('aside'), PopoverTrigger: wrap('div'),
    PALETTE_AREA: 'palette', TITLEBAR_AREAS: { right: 'titleBar.right' },
    atom: value => ({ get: () => value, set: next => { value = next }, listen: () => () => {} }),
    host: { notify: value => notices.push(value) }, translateNow: key => key,
    usePluginI18n: () => t, useValue: value => value.get()
  }
  const ctx = {
    i18n: { register: value => { bundles = value }, t },
    storage: {
      get: () => { if (storageFails) throw new Error('blocked'); return saved },
      set: (key, value) => { if (storageFails) throw new Error('blocked'); writes.push([key, value]) }
    },
    os: { writeClipboard: async value => { copies.push(value); return clipboard(value) } },
    register: value => contributions.push(value), onDispose: fn => disposers.push(fn)
  }
  const context = vm.createContext({ console })
  const make = exports => new vm.SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value)
  }, { context })
  const deps = new Map([['@hermes/plugin-sdk', make(sdk)], ['react/jsx-runtime', make(jsxRuntime)]])
  const module = new vm.SourceTextModule(source, { context })
  await module.link(name => { assert.ok(deps.has(name), `Unexpected import: ${name}`); return deps.get(name) })
  await module.evaluate()
  const m = module.namespace
  m.default.register(ctx)
  return { m, sdk, t, copies, writes, notices, contributions, dispose: () => disposers.forEach(fn => fn()),
    html: () => renderToStaticMarkup(React.createElement(m.YouTubeMenu)) }
}
function find(node, type) {
  if (!React.isValidElement(node)) return null
  if (node.type === type) return node
  for (const child of React.Children.toArray(node.props.children)) { const found = find(child, type); if (found) return found }
  return null
}
test('manual mode defaults ON without opening pages, copying or writing preferences', async () => {
  const p = await load()
  assert.equal(p.m.default.defaultEnabled, false, 'Plugin installation opt-in is separate from manual mode default')
  assert.match(p.html(), /aria-checked="true"/)
  assert.match(p.html(), /Manual tab setup · Beta/)
  assert.doesNotMatch(p.html(), /data-preview-markdown/)
  assert.deepEqual([p.copies, p.writes, p.notices], [[], [], []])
})
test('switch saves OFF, reload respects OFF, switching ON removes preview controls', async () => {
  const p = await load()
  const control = find(p.m.ManualGuide({ t: p.t }), p.sdk.Switch)
  assert.ok(control)
  control.props.onCheckedChange(false)
  assert.match(p.html(), /aria-checked="false"/)
  assert.equal((p.html().match(/data-preview-markdown=/g) ?? []).length, 2)
  assert.deepEqual(p.writes, [['manualPinGuide', false]])
  assert.match((await load({ saved: p.writes.at(-1)[1] })).html(), /aria-checked="false"/)
  p.m.setManualGuide(true)
  assert.match(p.html(), /aria-checked="true"/)
  assert.doesNotMatch(p.html(), /data-preview-markdown/)
  assert.deepEqual(p.copies, [])
})
test('malformed storage values default ON and nonboolean toggle values are ignored', async () => {
  for (const saved of [undefined, null, 0, 'false', {}, []]) {
    const p = await load({ saved })
    assert.match(p.html(), /aria-checked="true"/)
    p.m.setManualGuide('false')
    assert.deepEqual(p.writes, [])
  }
})
test('storage refusal still permits session-local switching', async () => {
  const p = await load({ storageFails: true })
  assert.match(p.html(), /aria-checked="true"/)
  assert.doesNotThrow(() => p.m.setManualGuide(false))
  assert.match(p.html(), /aria-checked="false"/)
})
test('each manual card copies only its allowlisted URL on explicit click', async () => {
  const p = await load()
  for (const destination of p.m.DESTINATIONS) {
    const button = find(p.m.Destination({ destination, t: p.t }), p.sdk.Button)
    assert.ok(button)
    await button.props.onClick()
    assert.equal(p.copies.at(-1), destination.url)
    assert.equal(p.notices.at(-1).kind, 'success')
  }
  assert.equal(p.copies.length, 2)
  assert.match(p.html(), /Pin to workspace/)
  assert.match(p.html(), /does not verify/)
  assert.match(p.html(), /reuse/)
})
test('clipboard false/rejection reports failure, not page or pin completion', async () => {
  for (const clipboard of [async () => false, async () => { throw new Error('blocked') }]) {
    const p = await load({ clipboard })
    assert.equal(await p.m.copyDestination('https://www.youtube.com/'), false)
    assert.equal(p.notices.at(-1).kind, 'error')
    assert.match(p.notices.at(-1).message, /Copy failed/)
  }
})
test('invalid destinations and disposed actions cannot write clipboard or preference', async () => {
  const p = await load()
  for (const url of ['https://example.com/', 'javascript:alert(1)', 'https://www.youtube.com.evil.test/', null]) {
    assert.equal(await p.m.copyDestination(url), false)
  }
  p.dispose()
  p.m.setManualGuide(false)
  assert.equal(await p.m.copyDestination('https://www.youtube.com/'), false)
  assert.deepEqual([p.copies, p.writes], [[], []])
})
test('late copy completion stays silent after unload', async () => {
  let resolve
  const p = await load({ clipboard: () => new Promise(done => { resolve = done }) })
  const pending = p.m.copyDestination('https://www.youtube.com/')
  p.dispose()
  resolve(true)
  assert.equal(await pending, true)
  assert.deepEqual(p.notices, [])
})
test('English/Korean/fallback show manual instructions without raw guest elements', async () => {
  for (const locale of ['en', 'ko', 'fr']) {
    const p = await load({ locale })
    assert.match(p.html(), locale === 'ko' ? /수동 탭 설정 · 베타/ : /Manual tab setup · Beta/)
    assert.match(p.html(), /https:\/\/www.youtube.com\/shorts\//)
    assert.doesNotMatch(p.html(), /<iframe|<webview|<script/)
  }
})
test('no automatic pin, private store or core-DOM adapter remains in production', () => {
  assert.doesNotMatch(source, /createAutoPin|MutationObserver|querySelector|onClickCapture|dispatchEvent|localStorage|(?:window|document)\s*\.\s*[A-Za-z_$]|setPreviewTabPinned|newBrowserTab/)
})
