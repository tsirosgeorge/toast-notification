# Changelog

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