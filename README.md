# YouTube Dock for Hermes Desktop

YouTube Home and Shorts beside your conversation, using Hermes' existing native Browser.

## 1.1.0-beta.1 — manual tab setup, default ON

This beta provides **manual setup guidance and address-copy buttons**, not automatic tab creation, selection or pinning. It replaces the unpublished automatic-pinning experiment; that adapter is not shipped. No Hermes core files are patched and no private store or core-DOM automation is used.

The **Manual tab setup · Beta** switch defaults **ON**, including upgrades without a saved choice. An explicit ON/OFF choice is stored only through the plugin's namespaced SDK storage. The plugin package itself remains opt-in; these are separate settings. Changing this switch does not open, hide, pin, unpin or close a Browser tab.

## Install

Requires **Hermes 0.22.2 or later** and the native Desktop app. This is a prerelease, not an automatically enabled stable catalog update.

In **Capabilities → Plugins → Install from Git**, use `https://github.com/metamindedu/hermes-youtube-dock`, select the Desktop component, and enable **YouTube Dock**. Or use:

```sh
hermes plugins install metamindedu/hermes-youtube-dock --ref v1.1.0-beta.1
```

Then use **Capabilities → Plugins → Rescan** and enable the Desktop plugin if needed. No Python backend, agent tools or dependencies are required to run it. For reproducible rollout, replace the tag with the full commit SHA shown in the release. Catalog availability and maintainer approval are separate from this Git prerelease.

## Use: default-ON manual mode

1. Open **▶ YouTube** in the titlebar or **YouTube** in the command palette.
2. Select a native **Browser** tab yourself. Create a blank Browser tab first if existing pages must remain unchanged.
3. Click **Copy address** under Home or Shorts, then paste the address into **that tab's own address bar** and press Enter. If clipboard access is unavailable, select/copy the displayed address manually.
4. Right-click that Browser tab and choose **Pin to workspace**. If it says **Unpin from workspace**, it is already pinned; do not click that item to pin it again.
5. Drag the tab into the desired split. Workspace pinning is the host mechanism for retaining visibility across chat switches in the same profile.

The plugin cannot verify that you selected, pinned or navigated the intended tab, and does not claim playback completion. There is no fictitious “pin verified” indicator. The copy success message confirms only the SDK clipboard result.

### Optional legacy mode: switch OFF

OFF restores the original SDK-rendered **Open preview / Hide** controls for Home and Shorts. The native Browser chooses which vessel to reuse; opening can navigate an existing tab. **Hide** hides/closes that preview, even if the page subsequently navigated elsewhere. Neither mode automatically pins a tab. Turning OFF does not undo manual pinning or close a video.

### Limitations

- Pinning is **visibility**, not exclusive ownership: later ordinary URL previews can reuse a pinned Browser. This beta does not reserve a dedicated vessel or provide cross-profile persistence.
- Layout, playback, sign-in and the Browser guest are host/YouTube responsibilities. No credentials are read or copied from an external browser. Region/account/age restrictions and embedded-browser sign-in restrictions still apply.
- No dedicated always-on-top PIP button, ad blocking, Premium bypass or measured CPU/RAM savings are claimed.
- Disabling the launcher removes its menu/command, not an already-open page. Close the Browser tab yourself to stop it.
- Host updates can change native menus or preview-card behavior. The plugin lives outside the core update tree; future compatibility is not guaranteed.
- Windows is the native manual-QA target. Portable CI does not establish live macOS/Linux player or layout support.

English and Korean strings are included; other locales fall back to English. `docs/menu.png` is the historical 1.0.0 launcher screenshot, not evidence of this beta's UI or playback.

## Privacy and permissions

| Surface | Behavior |
| --- | --- |
| Clipboard | Explicit Copy address click writes only one fixed YouTube URL through `ctx.os.writeClipboard`; no clipboard reads. |
| Local data | One boolean `manualPinGuide` in plugin-scoped SDK storage; no direct global storage/filesystem access. A storage failure leaves the current session's choice usable but persistence is not guaranteed. |
| Browser/network | No page opens at plugin load or on switching modes. Manual mode requires the user's address-bar navigation. Legacy mode opens only after the user clicks its preview control. YouTube's normal third-party requests then apply. |
| Native UI | No core-markup queries, automatic menu clicks, private state, observers, raw webviews or guest scripts. Legacy card styling is scoped to the plugin's own rendered subtree. |
| Credentials | No cookie, account, watch-history or recommendation reads. Native Browser login remains host-managed. |
| Agent/runtime | No tools, hooks, middleware, model calls, shell commands, backend, background jobs or polling. |
| Updates/telemetry | No self-updater, remote code loader or telemetry. |

## Development and tests

Node is required only for tests:

```sh
npm ci --ignore-scripts
npm run check
HERMES_SOURCE_ROOT=/path/to/hermes-agent npm run check
```

Portable tests use real React server rendering with explicit SDK doubles. They cover default ON, stored OFF and reload, switch event wiring, invalid storage values, storage failures, fixed address copying, clipboard failure/unload, translations, legacy controls and absence of automatic pin code. The optional integration compiles the actual host preview-link decoder read-only; it is not a native Browser/player test. CI uses Windows and Ubuntu with a pinned Hermes 0.22.2 decoder checkout. Test passes do not imply automatic tab management or live playback acceptance. Release notes distinguish native manual checks from test doubles.

## 한국어

**수동 탭 설정 · 베타는 기본 ON**입니다. 메뉴에서 주소를 복사하고, 직접 선택한 Browser 탭의 주소창에 붙여넣은 뒤 탭 메뉴의 **Pin to workspace**로 고정하세요. 이미 **Unpin from workspace**로 표시되면 다시 누르지 마세요. 코어·다른 탭을 자동 조작하거나 고정 완료를 추정하지 않습니다.

옵션을 OFF로 바꾸면 기존 **Open preview / Hide** 버튼이 나타납니다. 이 방식은 기존 Browser 탭을 재사용할 수 있습니다. 옵션 변경만으로 이미 열린 탭을 닫거나 고정을 해제하지는 않습니다. 고정은 같은 프로필의 대화 전환 시 가시성을 위한 기능이며 다른 미리보기의 탭 재사용을 막지는 않습니다.

## Support and license

Report issues in this repository with Hermes version, OS and the failing step. Never attach cookies, tokens or account credentials. [MIT](LICENSE). Independent community software; not affiliated with YouTube, Google or Nous Research.
