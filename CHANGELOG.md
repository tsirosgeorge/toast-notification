# Changelog

## [Unreleased]

### Changed
- **Breaking:** `message` is rendered as text. It previously went through `innerHTML`, so
  any message assembled from user input — a database field, a form value, an API error —
  could run JavaScript on the page. `<script>` tags never ran, but `<img src=x onerror>`
  did, which is the usual way this is exploited. Pass `allowHtml: true` on the calls where
  you deliberately wrote markup.
- **Breaking:** icons are inline SVG instead of animated GIFs. The four GIFs were 323 kB —
  fifteen times the library itself — were 400x400 for a 30px slot, and each cost a network
  round trip before the icon could appear. The glyph is now stroked on once as the toast
  appears, respects `prefers-reduced-motion`, and stays sharp at any size. `assets/img/` is
  no longer published; the published package went from 531 kB to 135 kB.

### Added
- A Playwright suite covering every bug fixed since 5.3.3, run in a real browser and wired
  into the release workflow. Until now each fix was verified by hand once and nothing
  stopped it regressing.

### Removed
- The unused PNG icons, and the dead `ts-toast-d-flex` and `ts-toast-no-scroll` CSS rules.

## [5.6.1] - 2026-09-19

### Fixed
- A dialog opening over another one no longer dims the page a second time. Every overlay
  painted its own 50% black, so two stacked dialogs left the page nearly opaque.
- Demo: Enter is how a `<select>` commits the highlighted option, but the playground
  treated Enter anywhere in its options form as "Run". Choosing a field type with the
  keyboard therefore opened the dialog immediately, and clicking Run afterwards opened a
  second one. The same handler fired for the checkboxes and the tab buttons, which act on
  Enter themselves and so double-fired. Enter now runs the config only from a text input.

## [5.6.0] - 2026-09-19

### Added
- `pauseOnHover` (default `true`): the countdown freezes while the pointer or keyboard
  focus is on a toast, so a message can no longer vanish mid-sentence.
- `showProgress`: a bar counting the remaining time down, which pauses with the timer.
- `action: { text, onClick }`: a button inside a toast, e.g. Undo.
- `toast.promise(promise, { loading, success, error })`: one loading toast that becomes
  the success or error message. Resolves with the promise's value and re-throws its
  rejection, so the caller still owns the failure. `success` and `error` may be functions
  and receive the value or the error.
- `toast.defaults`: options applied to every toast unless the call overrides them.

### Fixed
- `toast.update()` honours `duration: 0`. It had no `duration > 0` guard, so it scheduled
  a removal at 0ms and dropped the toast immediately — which broke every
  `toast.loading(...).update(msg, { duration: 0 })`.
- `toast.update()` rebinds `onDismiss` instead of leaving the creation-time callback in
  place, so one toast no longer fires two different dismiss handlers.
- `toast.update()` reuses the toast's own removal path. Its private copy of that logic
  skipped the exit transform and the reduced-motion handling, so updated toasts left the
  screen differently from every other toast.
- The loader no longer always runs for 2s: with a shorter `duration` the toast was gone
  before the icon it reveals ever appeared.
- `toast.update()` without a `type` no longer appends an empty `<img>`.
- Toast containers are removed once they empty, instead of accumulating in the DOM.
- A toast can no longer run its exit twice, and so can no longer fire `onDismiss` twice.
- Opening a confirm dialog no longer shifts the page sideways on platforms with classic
  scrollbars: hiding the page scrollbar is now compensated with padding. (Unverifiable on
  macOS, which uses overlay scrollbars; the compensation is a no-op there.)

## [5.5.0] - 2026-09-19

### Fixed
- A confirm dialog now takes focus when it opens. It did not before, so the button that
  opened it kept focus behind the backdrop and Enter or Space re-triggered it, stacking a
  second dialog on top of the first. Tab is now trapped inside the dialog, Escape cancels,
  and focus returns to the trigger when the dialog closes.
- Selecting text in a dialog's input and releasing the mouse outside the card no longer
  cancels the dialog. The resulting click reported the backdrop as its target, so the
  dialog was thrown away mid-edit. A cancel now requires press *and* release on the
  backdrop.
- Enter in a single-line confirm input submits, the way a native `prompt()` does. It
  previously did nothing. A `textarea` keeps Enter for newlines.
- The page no longer scrolls behind an open dialog.
- `onClick` fires on the click instead of 500ms later, when the exit animation ended.
- `toast.loading().close()` fires `onDismiss`; its hand-rolled copy of the removal never did.
- A vertical swipe past a toast no longer dismisses it — dismissal now needs a
  mostly-horizontal gesture — and the touch listeners are passive.

### Added
- `position: 'center'` places a toast in the dead centre of the viewport, and centres a
  confirm dialog on its backdrop. Previously only the six edge positions existed. It
  defaults to the `zoom-in` animation, since there is no edge for it to slide in from.
- `allowHtml: false` renders `message` as text. It stays `true` by default for
  compatibility, but any message built from user input should set it.
- `closeOnEscape` (default `true`) for confirm dialogs.
- `toast.dismissAll()`, and a `close()` method on the element every toast call returns.
- Accessibility: `role="dialog"`, `aria-modal` and `aria-labelledby` on confirm dialogs;
  `aria-live="polite"` on toast containers; `role="alert"` on error and warning toasts;
  `prefers-reduced-motion` is honoured.

### Changed
- CI uses `actions/checkout@v5` and `actions/setup-node@v5`; the v4 actions were being
  forced onto Node 24 with a deprecation warning.

## [5.4.0] - 2026-09-19

### Fixed
- `toast.confirm()` now resolves when the dialog is dismissed. Clicking the backdrop or the
  `(×)` button closed the dialog without calling `onResult`, so `await toast.confirm(...)`
  never settled and the calling code stalled.
- Confirm dialogs with an `input` can no longer be mistaken for a cancel. Confirming now
  always resolves a string (possibly `''`) and cancelling resolves `null`; previously an
  empty submission resolved `''`, which is falsy and indistinguishable from a cancel.
- `toast.update()` no longer overwrites `className`. It was dropping `ts-toast-show`,
  dropping `ts-toast-confirm` (breaking confirm layouts), writing the wrong `show` class,
  and leaking the position onto the toast instead of its container.
- `toast.success()` / `toast.error()` return the toast element, so the result can be passed
  to `toast.update()`.
- Confirm dialogs centre on the backdrop by default. The `position` default of `top-right`
  is meant for toasts and parked modals in a corner.
- Icon GIFs are no longer requested with a cache-busting query string, so the browser and
  the CDN can cache them instead of refetching up to 157 KB per toast.
- CDN asset URLs are derived from a single version constant kept in sync with
  `package.json`. They were six hand-edited literals and had gone stale (5.3.3 loaded
  5.3.0 assets).
- The stylesheet `<link>` no longer declares a top-level `const link`, which could collide
  with a page's own global, and is not injected twice if the script loads twice.

### Added
- `toast.warning()` and `toast.info()` helpers, matching `success` / `error`.
- TypeScript declarations (`toast.d.ts`), including the confirm resolution contract.
- `window.TS_TOAST_ASSET_BASE` to self-host the CSS and icons, and `window.TS_TOAST_NO_CSS`
  to skip the CDN stylesheet entirely.
- `exports` entries for `assets/css/toast.css` and `assets/css/toast.min.css`, which the
  subpath-less `exports` map had made unimportable from bundlers.

### Changed
- `toast.module.js` is generated from `toast.js` by `npm run build` instead of being a
  hand-maintained copy that had to be edited twice for every fix.
- Dropped `assets/img/old/` from the published package: 909 kB → 365 kB.
- Renamed the `publish` script to `release`. npm runs `publish` as a lifecycle hook after
  `npm publish`, so a `publish` script calling `npm publish` recursed.
- Rebuilt the demo page (`index.html`) around quick one-click examples and a playground
  that shows the code for the current options.

## [5.3.3] - 2025-12-31

### Fixed
- Updated README license note to reference LICENSE file correctly

## [5.3.2] - 2025-12-31

### Added
- LICENSE file with proprietary license terms
- License notice in README
- LICENSE and README.md now included in npm package

## [5.3.1] - 2025-12-31

### Fixed
- CSS now loads from CDN instead of relative path to prevent 404 errors on external sites
- Updated all remaining asset URLs to 5.3.0

## [5.3.0] - 2025-12-31

### Added
- Input field support for confirm modals (text, email, password, number, textarea)
- Position support for confirm overlays (top-left, top-right, bottom-center, etc.)
- Input placeholder and default value options
- Promise-based confirms now return input value when confirmed

### Fixed
- Confirm modal fade-out animation now works smoothly (500ms transition)
- Input values properly returned from both promise and callback APIs
- Overlay positioning respects position option for centered/corner placement

## [5.1.0] - 2025-09-10

### Added
- Confirm mode (SweetAlert-like) with Promise and callback APIs.
- Overlay support with optional close button (×) and overlay click to cancel.
- Customizable confirm/cancel button colors.
- Title option above confirm text; improved confirm layout and icon badge.
- New positions: top-center and bottom-center; smart default animations.
- Playground in `index.html` to test all options.

### Fixed
- Loading flow: sticky during loading; success shown only on update.
- Darker overlay and consistent icon classes.

## [5.1.1] - 2025-09-10

### Fixed
- Include `assets/img/` in npm package so GIF icons load from CDN.
- Pin CDN URLs in code/docs to 5.1.1.

## [5.2.0] - 2025-09-10

### Changed
- Namespaced all animation keyframes and state classes to `ts-toast-*` to avoid host-site CSS conflicts.
- Backwards-compatible mapping for animation option values.

## [5.0.7] - 2025-08-15

### Changed
- Reduced the size of the gifs

## [5.0.6] - 2025-07-11

### Changed
- Added position Top-Center

## [5.0.5] - 2025-06-04

### Changed
- Fixed default icons

## [5.0.4] - 2025-06-04

### Changed
- Fixed default icons

## [5.0.3] - 2025-06-04

### Changed
- Fixed default icons

## [5.0.2] - 2025-06-04

### Changed
- CSS class names now prefixed to avoid conflicts

## [5.0.1] - 2025-06-04

### Changed
- CSS class names now prefixed to avoid conflicts

## [5.0.0] - 2025-06-04

### Changed
- CSS class names now prefixed to avoid conflicts