import {
  Button, Codicon, MessageTextContent, PALETTE_AREA, Popover,
  PopoverContent, PopoverTrigger, TITLEBAR_AREAS, Switch, atom, host, usePluginI18n, useValue
} from '@hermes/plugin-sdk'
import { jsx, jsxs } from 'react/jsx-runtime'

export const VERSION = '1.1.0-beta.1'
const ID = 'youtube-dock'
const menuOpen = atom(false)
const manualGuide = atom(true)
const GUIDE_KEY = 'manualPinGuide'
let context = null

// Only plugin-scoped preference storage; no native tab selection or mutation.
export function setManualGuide(value) {
  if (!context || typeof value !== 'boolean') return
  manualGuide.set(value)
  try { context.storage.set(GUIDE_KEY, value) } catch { /* Keep the session-local choice. */ }
}

export async function copyDestination(url) {
  const current = context
  if (!current || !DESTINATIONS.some(destination => destination.url === url)) return false
  let copied = false
  try { copied = await current.os.writeClipboard(url) === true } catch { /* Display the address for manual copying. */ }
  if (context === current) host.notify({
    kind: copied ? 'success' : 'error', message: current.i18n.t(copied ? 'copied' : 'copyFailed')
  })
  return copied
}

export const DESTINATIONS = Object.freeze([
  Object.freeze({ id: 'home', url: 'https://www.youtube.com/', icon: 'home' }),
  Object.freeze({ id: 'shorts', url: 'https://www.youtube.com/shorts/', icon: 'device-mobile' })
])

// The public message renderer owns #preview links. Unlike ordinary web links,
// these always use the native internal Browser, even with external links enabled.
// No guest injection, raw webview, cookie access, or private Electron bridge.
export function previewMarkdown(url) {
  if (!DESTINATIONS.some(destination => destination.url === url)) {
    throw new Error('Unsupported YouTube destination')
  }
  // "Preview:" labels are agent hand-off markers stripped from prose. An
  // ordinary label keeps the user-facing canonical preview control visible.
  return `[YouTube](#preview/${encodeURIComponent(url)})`
}

const bundles = {
  en: {
    title: 'YouTube',
    help: 'Help',
    manualTitle: 'Manual tab setup · Beta',
    manualNote: 'ON by default. You choose the tab and pin it; this switch only changes the launcher workflow.',
    stepSelect: 'Select a Browser tab yourself. Create a blank Browser tab first if you want to keep existing pages unchanged.',
    stepAddress: 'Copy an address below, paste it into that tab’s address bar and press Enter.',
    stepPin: 'Right-click that Browser tab → Pin to workspace. If the menu says Unpin from workspace, it is already pinned. Drag it into the desired split.',
    manualLimit: 'This plugin does not verify pinning, navigation or playback. Pinning keeps a tab visible across chats in the same profile; other preview opens can still reuse it. OFF does not unpin or close any tab.',
    copy: 'Copy address',
    copied: 'Address copied. Paste it into the Browser tab you selected, then pin that tab manually.',
    copyFailed: 'Copy failed. Select and copy the displayed address manually.',
    menu: 'YouTube — recommendations and Shorts',
    subtitle: 'Your YouTube, inside Hermes',
    home: 'Recommended videos',
    homeDescription: 'Browse your signed-in Home feed.',
    shorts: 'Shorts',
    shortsDescription: 'Open the vertical Shorts feed.',
    hint: 'Manual mode is OFF: Open preview may reuse an existing Browser tab; Hide closes that preview. No tab is automatically pinned.',
    layout: 'Resize or drag the Browser tab beside your conversation. Its tab menu can pin the page across chats or open a separate Hermes window.',
    privacy: 'Playback uses the existing internal Browser and its saved login. This plugin does not read cookies, watch history, or recommendations.',
    pip: 'This version uses the docked Browser. A dedicated picture-in-picture button is not included.',
    palette: 'YouTube: recommendations and Shorts'
  },
  ko: {
    title: 'YouTube',
    help: '도움말',
    manualTitle: '수동 탭 설정 · 베타',
    manualNote: '기본 ON입니다. 탭 선택과 고정은 직접 하며, 이 옵션은 실행 메뉴의 방식만 바꿉니다.',
    stepSelect: 'Browser 탭을 직접 선택하세요. 기존 페이지를 유지하려면 먼저 빈 Browser 탭을 새로 만드세요.',
    stepAddress: '아래 주소를 복사하여 선택한 탭의 주소창에 붙여넣고 Enter를 누르세요.',
    stepPin: '그 Browser 탭을 우클릭 → Pin to workspace(작업공간에 고정). Unpin from workspace이면 이미 고정된 상태입니다. 원하는 분할 영역으로 탭을 드래그하세요.',
    manualLimit: '플러그인은 고정·이동·재생 완료를 검증하지 않습니다. 고정은 같은 프로필 내 대화 전환 시 탭을 유지하지만 다른 미리보기가 이 탭을 재사용할 수 있습니다. OFF로 바꿔도 탭을 닫거나 고정을 해제하지 않습니다.',
    copy: '주소 복사',
    copied: '주소를 복사했습니다. 직접 선택한 Browser 탭의 주소창에 붙여넣고 탭을 수동으로 고정하세요.',
    copyFailed: '복사하지 못했습니다. 표시된 주소를 직접 선택해 복사하세요.',
    menu: 'YouTube — 추천 피드와 쇼츠',
    subtitle: '내 유튜브를 Hermes 안에서',
    home: '추천 피드',
    homeDescription: '로그인한 내 계정의 홈 추천 영상을 봅니다.',
    shorts: '쇼츠',
    shortsDescription: '세로형 쇼츠 피드를 열고 넘겨봅니다.',
    hint: '수동 모드 OFF: Open preview는 기존 Browser 탭을 재사용할 수 있고 Hide는 해당 미리보기를 닫습니다. 자동 고정은 하지 않습니다.',
    layout: 'Browser 탭을 대화 옆으로 드래그하거나 경계를 움직여 크기를 조절하세요. 탭 메뉴에서 다른 대화에도 고정하거나 별도 Hermes 창으로 분리할 수 있습니다.',
    privacy: '기존 내부 브라우저의 로그인 상태를 사용합니다. 플러그인은 쿠키·시청 기록·추천 목록을 읽지 않습니다.',
    pip: '이 버전은 내부 브라우저 도킹 방식입니다. 별도의 PIP 버튼은 포함하지 않습니다.',
    palette: 'YouTube: 추천 피드와 쇼츠'
  }
}

export function ManualGuide({ t }) {
  const enabled = useValue(manualGuide)
  return jsxs('section', {
    'aria-label': t('manualTitle'),
    style: { marginBottom: 16, fontSize: 12, lineHeight: 1.6 },
    children: [
      jsxs('div', {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
        children: [jsx('strong', { children: t('manualTitle') }), jsx(Switch, {
          checked: enabled, onCheckedChange: setManualGuide, 'aria-label': t('manualTitle')
        })]
      }),
      jsx('p', { style: { margin: '6px 0', color: 'var(--ui-text-tertiary)' }, children: t('manualNote') }),
      enabled && jsxs('div', { children: [
        jsx('ol', { style: { margin: '6px 0', paddingLeft: 20 }, children:
          ['stepSelect', 'stepAddress', 'stepPin'].map(key => jsx('li', { children: t(key) }, key)) }),
        jsx('p', { style: { margin: '8px 0 0', color: 'var(--ui-text-tertiary)' }, children: t('manualLimit') })
      ] })
    ]
  })
}

export function Destination({ destination, t }) {
  const manual = useValue(manualGuide)
  return jsxs('section', {
    'aria-label': t(destination.id),
    style: { minWidth: 0 },
    children: [
      jsxs('div', {
        style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
        children: [jsx(Codicon, { name: destination.icon, size: '1rem' }),
          jsx('h3', { style: { fontSize: 13, fontWeight: 600, margin: 0 }, children: t(destination.id) })]
      }),
      jsx('p', {
        style: { margin: '0 0 6px', fontSize: 12, color: 'var(--ui-text-tertiary)' },
        children: t(`${destination.id}Description`)
      }),
      manual ? jsxs('div', { children: [
        jsx('code', { style: { display: 'block', marginBottom: 6, fontSize: 11, overflowWrap: 'anywhere', userSelect: 'text' }, children: destination.url }),
        jsx(Button, { type: 'button', variant: 'outline', size: 'sm', onClick: () => copyDestination(destination.url), children: t('copy') })
      ] }) : jsx('div', {
        // Scope legacy card styling to our own rendered subtree only.
        className: 'youtube-dock-destination',
        children: jsxs('div', { children: [
          jsx('style', { children: '.youtube-dock-destination button[aria-label]{display:none}' }),
          jsx(MessageTextContent, { media: false, text: previewMarkdown(destination.url) })
        ] })
      })
    ]
  })
}

export function YouTubeMenu() {
  const t = usePluginI18n(ID)
  const open = useValue(menuOpen)
  const manual = useValue(manualGuide)
  return jsxs(Popover, {
    open,
    onOpenChange: value => menuOpen.set(value),
    children: [
      jsx(PopoverTrigger, {
        asChild: true,
        children: jsxs(Button, {
          type: 'button', variant: 'ghost', size: 'sm',
          'aria-label': t('menu'), title: t('menu'),
          style: { WebkitAppRegion: 'no-drag', gap: 6 },
          children: [jsx(Codicon, { name: 'play', size: '1rem' }), 'YouTube']
        })
      }),
      jsxs(PopoverContent, {
        align: 'end', side: 'bottom', collisionPadding: 12,
        'aria-label': t('menu'),
        style: { width: 'min(360px, calc(100vw - 24px))', maxHeight: 'min(660px, calc(100vh - 100px))', overflowY: 'auto', padding: 16 },
        children: [
          jsx('p', { style: { margin: '0 0 14px', fontSize: 13, fontWeight: 600 }, children: t('subtitle') }),
          jsx(ManualGuide, { t }),
          jsx('div', {
            style: { display: 'grid', gap: 16 },
            children: DESTINATIONS.map(destination => jsx(Destination, { destination, t }, destination.id))
          }),
          !manual && jsx('p', { style: { margin: '14px 0 0', fontSize: 11, lineHeight: 1.6, color: 'var(--ui-text-tertiary)' }, children: t('hint') }),
          jsxs('details', {
            style: { marginTop: 12, fontSize: 11, lineHeight: 1.6, color: 'var(--ui-text-tertiary)' },
            children: [
              jsx('summary', { style: { cursor: 'pointer' }, children: t('title') + ' · ' + t('help') }),
              ...['layout', 'privacy', 'pip'].map(key => jsx('p', { style: { marginBottom: 0 }, children: t(key) }, key))
            ]
          })
        ]
      })
    ]
  })
}

export default {
  id: ID,
  name: 'YouTube Dock',
  description: 'Browse your YouTube recommendations and Shorts in the Hermes internal Browser.',
  defaultEnabled: false,
  register(ctx) {
    ctx.i18n.register(bundles)
    context = ctx
    let saved
    try { saved = ctx.storage.get(GUIDE_KEY) } catch { /* Default ON if storage is unavailable. */ }
    manualGuide.set(typeof saved === 'boolean' ? saved : true)
    ctx.register({ id: 'menu', area: TITLEBAR_AREAS.right, order: 15, render: () => jsx(YouTubeMenu, {}) })
    ctx.register({
      id: 'open-menu', area: PALETTE_AREA,
      data: {
        id: 'youtube-dock.open', label: ctx.i18n.t('palette'),
        keywords: ['youtube', '유튜브', '쇼츠', 'shorts', '추천', 'video'],
        run: () => menuOpen.set(true)
      }
    })
    ctx.onDispose(() => {
      if (context !== ctx) return
      context = null
      manualGuide.set(true)
      menuOpen.set(false)
    })
  }
}
