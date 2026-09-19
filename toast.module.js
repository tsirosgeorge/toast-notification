"use strict";

// Single source of truth for the CDN this build points at.
// `npm run sync:version` rewrites it from package.json, so it can never go stale.
const TS_TOAST_VERSION = "5.6.1";
// Point this at your own copy of assets/ to self-host the CSS and icons
// (useful offline, behind a strict CSP, or when you don't want a CDN dependency):
//   window.TS_TOAST_ASSET_BASE = '/vendor/toastnotification';
const TS_TOAST_CDN = (typeof window !== 'undefined' && window.TS_TOAST_ASSET_BASE)
    ? String(window.TS_TOAST_ASSET_BASE).replace(/\/+$/, '')
    : `https://cdn.jsdelivr.net/npm/@tsirosgeorge/toastnotification@${TS_TOAST_VERSION}`;

// How many confirm dialogs are currently open. The body scroll lock belongs to the
// group, so only the last dialog to close may release it.
let tsToastOpenModals = 0;
let tsToastPrevOverflow = '';
let tsToastPrevPaddingRight = '';

const tsToastReducedMotion = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Everything inside the dialog a keyboard can reach, in DOM order.
const tsToastFocusable = (root) => Array.from(
    root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
).filter((el) => !el.disabled && el.offsetParent !== null);

let tsToastIdCounter = 0;

// Icons are inline SVG rather than animated GIFs. The four GIFs were 323 kB — fifteen
// times the whole library — were 400x400 for a 30px slot, and each one cost a network
// round trip before the icon could appear. The glyph is stroked so CSS can draw it on,
// once, when the toast appears.
const TS_TOAST_GLYPHS = {
    success: '<path class="ts-toast-glyph" style="--ts-len:26" d="M7 12.6 L10.4 16 L17 8.8"/>',
    error: '<path class="ts-toast-glyph" style="--ts-len:23" d="M8.3 8.3 L15.7 15.7 M15.7 8.3 L8.3 15.7"/>',
    info: '<circle class="ts-toast-dot" cx="12" cy="7.4" r="1.5"/><path class="ts-toast-glyph" style="--ts-len:7" d="M12 11 L12 17"/>',
    warning: '<path class="ts-toast-glyph" style="--ts-len:8" d="M12 6.6 L12 14"/><circle class="ts-toast-dot" cx="12" cy="17.3" r="1.5"/>'
};

// Fills the icon span for a type. Returns false when the type has no icon.
const tsToastPaintIcon = (el, type) => {
    const glyph = TS_TOAST_GLYPHS[type];
    if (!glyph) return false;
    // Fixed internal markup, never caller input.
    el.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<circle class="ts-toast-ring" cx="12" cy="12" r="12"/>' + glyph + '</svg>';
    return true;
};

// Load the stylesheet from the CDN, unless the page opted out by importing it itself
// (set window.TS_TOAST_NO_CSS = true before loading, or ship assets/css/toast.css yourself).
(function loadStylesheet() {
    const LINK_ID = 'ts-toast-stylesheet';
    if (typeof window !== 'undefined' && window.TS_TOAST_NO_CSS) return;
    if (document.getElementById(LINK_ID)) return;
    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = `${TS_TOAST_CDN}/assets/css/toast.min.css`;
    document.head.appendChild(link);
})();

        // Inject minimal styles for confirm actions and overlay (kept tiny to avoid breaking existing CSS)
    (function injectInlineStyles() {
        const STYLE_ID = 'ts-toast-inline-extras';
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            /* Ensure center positions exist even if external CSS lacks them */
            .ts-toast-container.top-center { top: 1rem; left: 50%; transform: translateX(-50%); align-items: center; }
            .ts-toast-container.bottom-center { bottom: 1rem; left: 50%; transform: translateX(-50%); align-items: center; }
            .ts-toast-container.center { top: 50%; left: 50%; transform: translate(-50%, -50%); align-items: center; }
            .ts-toast-overlay.center { align-items: center; justify-content: center; }
            .ts-toast-overlay.ts-toast-overlay-stacked { background: transparent; }
            @keyframes ts-toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
            .ts-toast .ts-toast-progress { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; transform-origin: left center; border-radius: 0 0 8px 8px; background: currentColor; opacity: 0.35; pointer-events: none; }
            .ts-toast .ts-toast-action { order: -1; flex: none; appearance: none; border: 0; background: transparent; color: #3b82f6; font: inherit; font-weight: 600; padding: 4px 8px; margin-left: 4px; border-radius: 6px; cursor: pointer; }
            .ts-toast .ts-toast-action:hover { background: rgba(59,130,246,0.12); }
            .ts-toast-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2147483646; }
            .ts-toast.ts-toast-confirm { max-width: min(92vw, 440px); width: max(320px, 60%); flex-direction: column; gap: 12px; padding: 16px 20px; background: var(--toast-bg, #fff); color: var(--toast-color, #000); border: 1px solid var(--toast-border, #e5e7eb); border-radius: 12px; box-shadow: var(--toast-shadow, 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)); text-align: center; }
            .ts-toast.ts-toast-confirm .ts-toast-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
            .ts-toast-actions { display: flex; gap: 10px; justify-content: center; margin-top: 12px; }
            .ts-toast-btn { appearance: none; border: 0; padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; }
            .ts-toast-btn.cancel { background: #e9ecef; color: #1f2937; }
            .ts-toast-btn.confirm { background: #3b82f6; color: #fff; }
            .ts-toast.ts-toast-error .ts-toast-btn.confirm,
            .ts-toast.ts-toast-warning .ts-toast-btn.confirm { background: #ef4444; color: #fff; }
            .ts-toast.ts-toast-confirm .ts-toast-title { font-weight: 700; font-size: 1.05rem; margin-top: 4px; }
            .ts-toast.ts-toast-confirm .ts-toast-close { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 999px; border: 0; background: transparent; color: #6b7280; font-size: 20px; line-height: 1; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
            .ts-toast.ts-toast-confirm .ts-toast-close:hover { background: rgba(0,0,0,0.06); }
            .ts-toast.ts-toast-confirm .ts-toast-icon { width: 64px; height: 64px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; }
            .ts-toast.ts-toast-confirm .ts-toast-icon svg { width: 36px; height: 36px; }
            .ts-toast.ts-toast-confirm.ts-toast-success .ts-toast-icon { background: #dcfce7; }
            .ts-toast.ts-toast-confirm.ts-toast-info .ts-toast-icon { background: #dbeafe; }
            .ts-toast.ts-toast-confirm.ts-toast-warning .ts-toast-icon { background: #fef3c7; }
            .ts-toast.ts-toast-confirm.ts-toast-error .ts-toast-icon { background: #fee2e2; }
        `;
        document.head.appendChild(style);
    })();

const toast = function (message, options = {}) {
        // Site-wide defaults, so a page can turn on things like showProgress once
        // instead of repeating them at every call site.
        options = { ...(toast.defaults || {}), ...options };
        const {
            position = 'top-right',
            animation = 'slide-right', // Default fallback animation
            type = 'info',
            duration = 3000,
            icon = null,
            showLoader = false,
            // behavior/mode: 'alert' (default) or 'confirm'/'swal'
            mode = 'alert',
            // confirm options (used when mode is 'confirm' or 'swal')
            title = null,
            confirmText = 'Yes',
            cancelText = 'No',
            // input field options
            input = false, // 'text', 'email', 'password', 'number', 'textarea', or false
            inputPlaceholder = '',
            inputValue = '',
            // confirm button color customization (optional)
            confirmButtonBg = null,
            confirmButtonColor = null,
            cancelButtonBg = null,
            cancelButtonColor = null,
            onConfirm = null,
            onCancel = null,
            onResult = null,
            useOverlay = true,
            closeOnOverlayClick = true,
            showClose = false,
            // Freeze the countdown while the pointer or keyboard focus is on the toast
            pauseOnHover = true,
            // Thin bar counting the remaining time down
            showProgress = false,
            // { text, onClick } renders a button inside the toast, e.g. Undo
            action = null,
            // Escape cancels a confirm dialog
            closeOnEscape = true,
            // `message` is rendered as plain text. Pass true only for markup you wrote
            // yourself: any string built from user input becomes executable HTML.
            allowHtml = false,
            // interactions
            dismissOnClick = true, // ignored if confirm-mode
            onClick = null,      // Custom onClick event listener
            onShow = null,       // Custom onShow event listener
            onDismiss = null     // Custom onDismiss event listener
        } = options;

        const isConfirm = (mode === 'confirm' || mode === 'swal');
        const reducedMotion = tsToastReducedMotion();

        // Pick an animation intelligently when one wasn't explicitly provided
        const resolvedAnimation = (typeof options.animation === 'string' && options.animation.trim())
            ? (function mapAnim(a){
                const m = {
                    'slide-top':'ts-toast-slide-top',
                    'slide-bottom':'ts-toast-slide-bottom',
                    'slide-left':'ts-toast-slide-left',
                    'slide-right':'ts-toast-slide-right',
                    'zoom-in':'ts-toast-zoom-in',
                    'zoom-out':'ts-toast-zoom-out',
                    'flip':'ts-toast-flip'
                };
                return m[a] || a;
            })(options.animation.trim())
            // 'center' has no edge to slide in from, so it zooms like a dialog.
            : (isConfirm || position === 'center' ? 'ts-toast-zoom-in'
                : position.startsWith('top') ? 'ts-toast-slide-top'
                : position.startsWith('bottom') ? 'ts-toast-slide-bottom'
                : position.endsWith('left') ? 'ts-toast-slide-left'
                : 'ts-toast-slide-right');

        // helper: remove with smooth CSS transition and cleanup (used by alerts)
        const removeWithAnimation = (el, callback) => {
            const anim = el.dataset && el.dataset.anim ? el.dataset.anim : (el.style.animation || '');
            let transform = '';
            if (anim.includes('ts-toast-slide-top')) {
                // Entered from top, exit upwards
                transform = 'translateY(-100%)';
            } else if (anim.includes('ts-toast-slide-bottom')) {
                // Entered from bottom, exit upwards
                transform = 'translateY(100%)';
            } else if (anim.includes('ts-toast-slide-left')) {
                // Entered from left, exit to right
                transform = 'translateX(100%)';
            } else if (anim.includes('ts-toast-slide-right')) {
                // Entered from right, exit to right
                transform = 'translateX(100%)';
            }

            el.classList.add('ts-toast-slide-out');
            el.classList.remove('ts-toast-show');
            // Stop any running keyframe animation and drive exit via CSS transition
            el.style.animation = '';
            if (transform) {
                el.style.transform = transform;
            }
            el.style.opacity = '0';

            setTimeout(() => {
                el.classList.remove('ts-toast-slide-out');
                if (el.parentNode) el.parentNode.removeChild(el);
                if (typeof callback === 'function') callback();
            }, reducedMotion ? 0 : 500);
        };

    const toastElement = document.createElement('div');
        toastElement.className = `ts-toast ts-toast-${type}${isConfirm ? ' ts-toast-confirm' : ''}`;
    toastElement.dataset.anim = resolvedAnimation;
    if (!reducedMotion) toastElement.style.animation = `${resolvedAnimation} 0.5s ease`;

        const uid = `ts-toast-${++tsToastIdCounter}`;
        if (isConfirm) {
            // Without these a screen reader announces nothing, and without tabindex the
            // dialog cannot take focus away from whatever opened it.
            toastElement.setAttribute('role', 'dialog');
            toastElement.setAttribute('aria-modal', 'true');
            toastElement.tabIndex = -1;
        } else if (type === 'error' || type === 'warning') {
            toastElement.setAttribute('role', 'alert');
        }
        // In confirm mode, we stack content vertically; in alert mode keep original layout
        if (!isConfirm) {
            toastElement.style.flexDirection = 'row-reverse';
            toastElement.style.justifyContent = 'flex-end';
        }

        // Create Icon Element
    const iconElement = document.createElement('span');
    iconElement.className = 'ts-toast-icon';
    iconElement.style.display = 'flex';
        if (icon) {
            iconElement.textContent = icon;
        } else {
            tsToastPaintIcon(iconElement, type);
        }

        // Create Body
        const toastBody = document.createElement('div');
        toastBody.className = 'ts-toast-body';
        toastBody.id = `${uid}-body`;
        // Text by default. innerHTML runs event handlers such as <img onerror>, so a
        // message assembled from user input was a scripting hole in every caller.
        if (allowHtml) toastBody.innerHTML = message;
        else toastBody.textContent = message;

        // Content row for confirm (icon + text side-by-side)
        let contentRow = null;
        if (isConfirm) {
            contentRow = document.createElement('div');
            contentRow.className = 'ts-toast-content';
            contentRow.appendChild(iconElement);
            if (title) {
                const titleEl = document.createElement('div');
                titleEl.className = 'ts-toast-title';
                titleEl.id = `${uid}-title`;
                titleEl.textContent = title;
                contentRow.appendChild(titleEl);
                toastElement.setAttribute('aria-labelledby', titleEl.id);
            }
            contentRow.appendChild(toastBody);
            toastElement.setAttribute('aria-describedby', toastBody.id);
            toastElement.appendChild(contentRow);
        } else {
            toastElement.appendChild(toastBody);
        }

        // Input field (for confirm mode with input)
        let inputElement = null;
        if (isConfirm && input) {
            if (input === 'textarea') {
                inputElement = document.createElement('textarea');
                inputElement.rows = 3;
            } else {
                inputElement = document.createElement('input');
                inputElement.type = input === 'text' || input === 'email' || input === 'password' || input === 'number' ? input : 'text';
            }
            inputElement.className = 'ts-toast-input';
            inputElement.placeholder = inputPlaceholder;
            inputElement.value = inputValue;
            // Enter submits a single-line field, the way a native prompt does.
            // A textarea keeps Enter for newlines.
            if (input !== 'textarea') {
                inputElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); resolveAndClose(true); }
                });
            }
            toastElement.appendChild(inputElement);
        }

        // Actions (for confirm mode)
        let actionsContainer = null;
        let resultResolver = null;
        // Assigned in confirm mode; the overlay and (x) handlers below call it so that
        // *every* way of dismissing the dialog settles the promise and the callbacks.
        let resolveAndClose = null;
        // Releases the scroll lock, the key handler and the focus this dialog took.
        let releaseModal = () => {};
        if (isConfirm) {
            actionsContainer = document.createElement('div');
            actionsContainer.className = 'ts-toast-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'ts-toast-btn cancel';
            cancelBtn.textContent = cancelText;

            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'ts-toast-btn confirm';
            confirmBtn.textContent = confirmText;

            // Apply custom button colors if provided (inline style overrides theme defaults)
            if (cancelButtonBg) cancelBtn.style.background = cancelButtonBg;
            if (cancelButtonColor) cancelBtn.style.color = cancelButtonColor;
            if (confirmButtonBg) confirmBtn.style.background = confirmButtonBg;
            if (confirmButtonColor) confirmBtn.style.color = confirmButtonColor;

            actionsContainer.appendChild(cancelBtn);
            actionsContainer.appendChild(confirmBtn);
            toastElement.appendChild(actionsContainer);

            // Create a Promise that resolves on user choice; expose via property
            toastElement.result = new Promise((resolve) => { resultResolver = resolve; });

            let settled = false;
            resolveAndClose = (confirmed) => {
                if (settled) return; // a button click and a backdrop click can race
                settled = true;
                // With an input, confirming always yields a string (possibly '') and
                // cancelling yields null, so an empty submission stays distinguishable
                // from a cancel. Without an input the contract is still true/false.
                const result = confirmed
                    ? (inputElement ? inputElement.value : true)
                    : (inputElement ? null : false);
                if (resultResolver) resultResolver(result);
                if (confirmed && typeof onConfirm === 'function') onConfirm(result, toastElement);
                if (!confirmed && typeof onCancel === 'function') onCancel(toastElement);
                if (typeof onResult === 'function') onResult(result, toastElement);
                releaseModal();
                // Use the same slide+fade removal as alerts
                removeWithAnimation(toastElement, () => {
                    if (onDismiss && typeof onDismiss === 'function') onDismiss(toastElement);
                    // Remove overlay if present
                    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                });
            };

            cancelBtn.addEventListener('click', (e) => { e.stopPropagation(); resolveAndClose(false); });
            confirmBtn.addEventListener('click', (e) => { e.stopPropagation(); resolveAndClose(true); });
        }

        // Action button (e.g. Undo). Clicking it runs the callback and closes the toast.
        if (!isConfirm && action && typeof action === 'object' && action.text) {
            const actionBtn = document.createElement('button');
            actionBtn.className = 'ts-toast-action';
            actionBtn.type = 'button';
            actionBtn.textContent = action.text;
            actionBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // do not also trigger dismissOnClick
                if (typeof action.onClick === 'function') action.onClick(toastElement);
                toastElement._dismiss();
            });
            toastElement.appendChild(actionBtn);
        }

        // Progress bar. The width is driven by a CSS animation whose duration is the
        // toast's own, so pausing it is one property and never drifts from the timer.
        let progressBar = null;
        if (!isConfirm && showProgress && duration > 0 && !reducedMotion) {
            progressBar = document.createElement('div');
            progressBar.className = 'ts-toast-progress';
            progressBar.style.animation = `ts-toast-progress ${duration}ms linear forwards`;
            progressBar.style.animationPlayState = 'paused';
            toastElement.appendChild(progressBar);
        }

        // Loader Element
        let loader = null;
        if (showLoader) {
            loader = document.createElement('div');
            loader.className = 'ts-toast-loader';
            toastElement.appendChild(loader);
        }

        // Container/Overlay
        let overlay = null;
        let containerEl = null;
        if (isConfirm && useOverlay) {
            overlay = document.createElement('div');
            // A modal centres by default. The `position` default of 'top-right' is meant
            // for toasts; applying it here parked the dialog in a corner of the backdrop.
            // Each backdrop paints its own 50% black, so a second dialog opening over a
            // first turned the page almost fully dark. Only the bottom one dims.
            const stacked = tsToastOpenModals > 0 ? ' ts-toast-overlay-stacked' : '';
            overlay.className = 'ts-toast-overlay' + stacked + (options.position ? ` ${position}` : '');
            document.body.appendChild(overlay);
            overlay.appendChild(toastElement);
            if (showClose) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'ts-toast-close';
                closeBtn.setAttribute('aria-label', 'Close');
                closeBtn.innerHTML = '&times;';
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Dismissing via (x) is a cancel, so it has to settle like one.
                    resolveAndClose(false);
                });
                toastElement.appendChild(closeBtn);
            }
            if (closeOnOverlayClick) {
                // The cancel must both start and end on the backdrop. Selecting text in
                // the input and releasing the mouse outside the card produced a click
                // whose target was the overlay, which threw the dialog away mid-edit.
                let pressedOnBackdrop = false;
                overlay.addEventListener('pointerdown', (e) => { pressedOnBackdrop = e.target === overlay; });
                overlay.addEventListener('click', (e) => {
                    // Backdrop click is a cancel: settle the promise and onCancel/onResult,
                    // then close. Previously this resolved only the internal el.result,
                    // so `await toast.confirm(...)` hung forever.
                    if (e.target === overlay && pressedOnBackdrop) resolveAndClose(false);
                    pressedOnBackdrop = false;
                });
            }
        } else {
            // Standard positioned container
            let container = document.querySelector(`.ts-toast-container.${position}`);
            if (!container) {
                container = document.createElement('div');
                container.className = `ts-toast-container ${position}`;
                document.body.appendChild(container);
            }
            if (!container.hasAttribute('aria-live')) {
                // Without this a toast is invisible to a screen reader.
                container.setAttribute('role', 'status');
                container.setAttribute('aria-live', 'polite');
                container.setAttribute('aria-relevant', 'additions');
            }
            container.appendChild(toastElement);
            containerEl = container;
        }

        if (isConfirm) {
            // The dialog has to own the keyboard while it is open. Without this the
            // element that opened it keeps focus, so pressing Enter or Space activates
            // it again and stacks a second dialog on top of the first — and Tab walks
            // through the page behind the backdrop.
            const previouslyFocused = document.activeElement;

            tsToastOpenModals += 1;
            if (tsToastOpenModals === 1) {
                tsToastPrevOverflow = document.body.style.overflow;
                tsToastPrevPaddingRight = document.body.style.paddingRight;
                // Hiding the scrollbar makes the page wider, which shifts the whole
                // layout sideways as the dialog opens. Pad by the scrollbar's width to
                // hold it still. A no-op where scrollbars are overlays, as on macOS.
                const scrollbar = window.innerWidth - document.documentElement.clientWidth;
                if (scrollbar > 0) {
                    const current = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
                    document.body.style.paddingRight = `${current + scrollbar}px`;
                }
                document.body.style.overflow = 'hidden';
            }

            // With dialogs stacked, only the top one should answer the keyboard.
            const isTopmost = () => {
                const open = document.querySelectorAll('.ts-toast.ts-toast-confirm');
                return open.length === 0 || open[open.length - 1] === toastElement;
            };

            const onKeydown = (e) => {
                if (!isTopmost()) return;

                if (e.key === 'Escape' && closeOnEscape) {
                    e.preventDefault();
                    resolveAndClose(false);
                    return;
                }
                if (e.key !== 'Tab') return;

                const focusables = tsToastFocusable(toastElement);
                if (!focusables.length) { e.preventDefault(); return; }

                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                // Focus can start outside the dialog (the trigger button); pull it back.
                if (!toastElement.contains(document.activeElement)) {
                    e.preventDefault();
                    (e.shiftKey ? last : first).focus();
                } else if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            };
            document.addEventListener('keydown', onKeydown, true);

            releaseModal = () => {
                document.removeEventListener('keydown', onKeydown, true);
                tsToastOpenModals = Math.max(0, tsToastOpenModals - 1);
                if (tsToastOpenModals === 0) {
                    document.body.style.overflow = tsToastPrevOverflow;
                    document.body.style.paddingRight = tsToastPrevPaddingRight;
                }
                // Hand the keyboard back to whatever opened the dialog.
                if (previouslyFocused && typeof previouslyFocused.focus === 'function' &&
                    document.contains(previouslyFocused)) {
                    previouslyFocused.focus();
                }
            };

            // Land on the input when there is one, otherwise the confirm button.
            (inputElement || toastElement.querySelector('.ts-toast-btn.confirm') || toastElement).focus();
        }

        // Trigger the onShow event if provided
        if (onShow && typeof onShow === 'function') {
            onShow(toastElement);
        }

        // Show Toast with animation
        setTimeout(() => {
            toastElement.classList.add('ts-toast-show');
        }, 100);

        // The loader always ran for 2s, so with a shorter duration the toast was gone
        // before the icon it reveals ever appeared.
        const loaderMs = duration > 0 ? Math.min(2000, Math.max(0, duration - 500)) : 2000;

        // Handle Loader and Icon
        if (showLoader && loader) {
            setTimeout(() => {
                // Skip auto-complete if controlled by toast.loading()
                if (toastElement._managedByLoading) return;
                loader.classList.add('done');
                loader.remove();
                if (!toastElement.contains(iconElement)) {
                    if (isConfirm && contentRow) contentRow.appendChild(iconElement);
                    else toastElement.appendChild(iconElement); // Add icon only if not present
                }
            }, loaderMs);
        }
        if (!showLoader) {
            // For confirm, icon already added above inside contentRow; avoid moving it
            if (!isConfirm && !toastElement.contains(iconElement)) {
                toastElement.appendChild(iconElement);
            }
        }

        // Dismissal state lives on the element so toast.update() can rebind the callback
        // and reuse this exact removal path instead of keeping its own copy of it.
        toastElement._onDismiss = typeof onDismiss === 'function' ? onDismiss : null;

        // A plain setTimeout cannot be paused, so the countdown is tracked by hand:
        // `remaining` is what is left, and hovering banks it.
        let remaining = duration;
        let timerId = null;
        let startedAt = 0;

        const stopTimer = () => {
            if (timerId) { clearTimeout(timerId); timerId = null; }
        };

        const startTimer = () => {
            if (isConfirm || remaining <= 0 || timerId) return;
            startedAt = Date.now();
            timerId = setTimeout(() => { timerId = null; toastElement._dismiss(); }, remaining);
            if (progressBar) progressBar.style.animationPlayState = 'running';
        };

        const pauseTimer = () => {
            if (!timerId) return;
            clearTimeout(timerId);
            timerId = null;
            remaining -= Date.now() - startedAt;
            if (progressBar) progressBar.style.animationPlayState = 'paused';
        };

        toastElement._dismiss = () => {
            if (toastElement._removing) return; // never run the exit twice
            toastElement._removing = true;
            stopTimer();
            removeWithAnimation(toastElement, () => {
                if (toastElement._onDismiss) toastElement._onDismiss(toastElement);
                // Containers used to pile up in the DOM, one per position, forever.
                if (containerEl && !containerEl.children.length) containerEl.remove();
            });
        };

        // Lets toast.update() re-arm the countdown without reaching into internals.
        toastElement._setDuration = (ms) => {
            stopTimer();
            remaining = ms;
            startTimer();
        };

        startTimer();

        if (!isConfirm && pauseOnHover) {
            // Give the reader a chance to finish the sentence.
            toastElement.addEventListener('mouseenter', pauseTimer);
            toastElement.addEventListener('mouseleave', startTimer);
            toastElement.addEventListener('focusin', pauseTimer);
            toastElement.addEventListener('focusout', startTimer);
        }

        // Add event listener for closing the toast when clicked (disabled in confirm mode)
        if (!isConfirm && dismissOnClick) {
            toastElement.addEventListener('click', () => {
                // onClick belongs to the click, not to the end of the exit animation,
                // which is where it used to fire half a second late.
                if (onClick && typeof onClick === 'function') onClick(toastElement);
                toastElement._dismiss();
            });
        }

        // Add swipe event listeners for mobile dismissal
        if (!isConfirm) {
            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;

            // Passive: these never preventDefault, and a non-passive touchstart blocks
            // scrolling on the whole toast.
            toastElement.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });

            toastElement.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const dx = Math.abs(touchStartX - touchEndX);
                const dy = Math.abs(touchStartY - e.changedTouches[0].screenY);
                // Only a mostly-horizontal swipe dismisses, so scrolling the page past a
                // toast no longer throws it away on a bit of sideways drift.
                if (dx > 50 && dx > dy) toastElement._dismiss();
            });
        }

        // Let callers dismiss a toast they are holding, instead of only waiting out
        // the duration or making the user click it.
        toastElement.close = () => {
            if (isConfirm) { resolveAndClose(false); return; }
            toastElement._dismiss();
        };

        return toastElement;
    };

    // Shorthands return the toast element so it can be passed to toast.update().
    toast.success = function (message, options) {
        return toast(message, { ...options, type: 'success' });
    };

    toast.error = function (message, options) {
        return toast(message, { ...options, type: 'error' });
    };

    toast.warning = function (message, options) {
        return toast(message, { ...options, type: 'warning' });
    };

    toast.info = function (message, options) {
        return toast(message, { ...options, type: 'info' });
    };

    // Update toast function to handle removal with animation
    toast.update = function (toastElement, message, options = {}) {
        const {
            type = null,
            icon = null,
            showLoader = false,
            duration = 3000, // Default duration (in ms); 0 keeps the toast on screen
            allowHtml = false,
            onDismiss = null     // Replaces the callback the toast was created with
        } = options;

        // Remove old loader (if any)
        const oldLoader = toastElement.querySelector('.ts-toast-loader');
        const oldIcon = toastElement.querySelector('.ts-toast-icon');
        if (oldLoader) oldLoader.remove();

        // Update toast class and message. Swap only the type modifier: overwriting
        // className dropped ts-toast-show (so the toast faded out), dropped
        // ts-toast-confirm (so confirm dialogs lost their layout), and leaked the
        // position onto the toast instead of the container.
        if (type) {
            ['success', 'error', 'info', 'warning'].forEach((t) => toastElement.classList.remove(`ts-toast-${t}`));
            toastElement.classList.add('ts-toast', `ts-toast-${type}`, 'ts-toast-show');
        }
        const toastBody = toastElement.querySelector('.ts-toast-body');
        if (toastBody) {
            if (allowHtml) toastBody.innerHTML = message;
            else toastBody.textContent = message;
        }

        // Handle Icon update only if it's new or hasn't been set yet
        if (oldIcon) {
            oldIcon.remove(); // Remove the old icon first
        }

    const iconElement = document.createElement('span');
    iconElement.className = 'ts-toast-icon';
    iconElement.style.display = 'flex';

        let hasIcon = Boolean(icon);
        if (icon) {
            iconElement.textContent = icon;
        } else {
            hasIcon = tsToastPaintIcon(iconElement, type);
        }

        // Only attach an icon we actually have. Without a type and without an explicit
        // icon this used to append an empty icon element.
        if (hasIcon) {
            const contentRow = toastElement.querySelector('.ts-toast-content');
            (contentRow || toastElement).appendChild(iconElement);
        }

        // Handle loader if requested
        if (showLoader) {
            const loader = document.createElement('div');
            loader.className = 'ts-toast-loader';
            toastElement.appendChild(loader);
            setTimeout(() => {
                loader.classList.add('done');
            }, duration > 0 ? Math.min(2000, Math.max(0, duration - 500)) : 2000);
        }

        // Rebind the dismiss callback rather than leaving the creation-time one in place,
        // which meant an updated toast fired two different onDismiss handlers.
        if (typeof onDismiss === 'function') toastElement._onDismiss = onDismiss;

        // Re-arm the countdown through the toast's own timer, so duration: 0 keeps the
        // toast on screen. This used to schedule setTimeout(..., 0) and remove it at once,
        // which broke every `toast.loading(...).update(msg, { duration: 0 })`.
        if (typeof toastElement._setDuration === 'function') {
            toastElement._setDuration(duration);
        }
    };

    toast.loading = function (message, options = {}) {
        const toastElement = toast(message, {
            ...options,
            type: options.type || 'info', // Default type is 'info'
            duration: 0, // Sticky until manually updated/closed
            showLoader: true, // Always show loader during loading
            icon: null
        });

        // Force reflow and add animation after DOM insert
        requestAnimationFrame(() => {
            toastElement.classList.add('ts-toast-show');
        });

        const loader = toastElement.querySelector('.ts-toast-loader');
        let iconElement = toastElement.querySelector('.ts-toast-icon');

        // Ensure the iconElement is created and appended if it doesn't exist
        if (!iconElement) {
            iconElement = document.createElement('span');
            iconElement.className = 'ts-toast-icon';
            iconElement.style.display = 'flex';
            toastElement.appendChild(iconElement);
        }

        // mark as managed by loading flow to avoid internal auto-complete
        toastElement._managedByLoading = true;

        // Ensure loader is handled properly
        if (loader) {
            setTimeout(() => {
                // Keep spinning until update() decides otherwise
                if (!toastElement._managedByLoading) loader.classList.add('done');
            }, 2000); // Simulate a loading period of 2 seconds
        }

        return {
            update: (newMessage, newOptions = {}) => {
                // Let update manage completion: stop managing/finish loader
                toastElement._managedByLoading = false;
                toast.update(toastElement, newMessage, {
                    ...newOptions,
                    showLoader: false // Disable loader when updating the message
                });
            },
            // Reuse the element's own close so onDismiss fires, which this
            // hand-rolled copy of the removal never did.
            close: () => {
                toastElement._managedByLoading = false;
                toastElement.close();
            }
        };
    };

    // Convenience API: swal-like confirm dialog
    // Usage: toast.confirm('Are you sure?', { type: 'warning', confirmText: 'Yes', cancelText: 'No' }).then(ok => {...})
    toast.confirm = function (message, options = {}) {
        return new Promise((resolve) => {
            const el = toast(message, {
                ...options,
                mode: 'confirm',
                duration: 0, // prevent auto-dismiss
                dismissOnClick: false,
                onResult: (val) => resolve(val)
            });
            // If consumer needs the element, it is returned by toast() but we ignore here.
            // They can still call toast(...) with mode: 'confirm' to get the element and read el.result
            void el; // no-op
        });
    };

    // Wraps an async action: one loading toast that becomes the success or error
    // message, instead of hand-rolling loading/update/catch at every call site.
    toast.promise = function (promise, messages = {}, options = {}) {
        const {
            loading = 'Loading…',
            success = 'Done',
            error = 'Something went wrong'
        } = messages;

        const handle = toast.loading(loading, options);
        // Messages may be functions so they can name what actually came back.
        const text = (msg, value) => (typeof msg === 'function' ? msg(value) : msg);

        return Promise.resolve(promise).then(
            (value) => {
                handle.update(text(success, value), { type: 'success', duration: options.duration });
                return value;
            },
            (err) => {
                handle.update(text(error, err), { type: 'error', duration: options.duration });
                throw err; // the caller still owns the failure
            }
        );
    };

    // Options applied to every toast unless the call overrides them.
    toast.defaults = {};

    // Close every toast currently on screen. Confirm dialogs settle as a cancel.
    toast.dismissAll = function () {
        document.querySelectorAll('.ts-toast').forEach((el) => {
            if (typeof el.close === 'function') el.close();
        });
    };

// Expose globally for CDN / browser usage
if (typeof window !== 'undefined') {
    window.toast = toast;
}

// ES module export
export default toast;
export { toast };
