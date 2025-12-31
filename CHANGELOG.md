# Changelog

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